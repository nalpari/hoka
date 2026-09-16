package com.hoka.bo.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import com.hoka.bo.common.ApiException;
import com.hoka.bo.common.CurrentUser;
import com.hoka.bo.common.Tokens;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthService {

    static final Duration ACCESS_TTL = Duration.ofMinutes(15);
    static final Duration REFRESH_TTL_REMEMBER = Duration.ofDays(30);
    static final Duration REFRESH_TTL_SESSION = Duration.ofHours(12);
    static final Duration DORMANT_AFTER = Duration.ofDays(90);
    static final int MAX_FAILED_ATTEMPTS = 5;
    static final int MIN_PASSWORD_LENGTH = 8;

    private final AuthUserMapper authUserMapper;
    private final RefreshTokenMapper refreshTokenMapper;
    private final LoginHistoryMapper loginHistoryMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;

    public AuthService(AuthUserMapper authUserMapper, RefreshTokenMapper refreshTokenMapper,
            LoginHistoryMapper loginHistoryMapper, PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder) {
        this.authUserMapper = authUserMapper;
        this.refreshTokenMapper = refreshTokenMapper;
        this.loginHistoryMapper = loginHistoryMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
    }

    @Transactional
    public TokenPair login(String email, String password, boolean rememberMe, String ip, String userAgent) {
        Credentials user = authUserMapper.findByEmail(email);
        // 없는 이메일도 비밀번호가 틀린 것과 똑같이 응답해 계정 존재 여부를 숨긴다.
        if (user == null) {
            record(null, email, "FAILED", ip, userAgent);
            throw invalidCredentials();
        }
        if (user.isLocked()) {
            record(user.id(), email, "FAILED", ip, userAgent);
            throw locked(user.lockReason());
        }
        // 초대 대기·비활성 계정도 구분해 알리지 않는다.
        if (!user.isActive() || user.passwordHash() == null) {
            record(user.id(), email, "FAILED", ip, userAgent);
            throw invalidCredentials();
        }
        if (!passwordEncoder.matches(password, user.passwordHash())) {
            authUserMapper.increaseFailedCount(user.id());
            boolean nowLocked = user.failedLoginCount() + 1 >= MAX_FAILED_ATTEMPTS;
            if (nowLocked) {
                authUserMapper.lock(user.id(), "PASSWORD_FAILED");
            }
            record(user.id(), email, nowLocked ? "LOCKED" : "FAILED", ip, userAgent);
            throw nowLocked ? locked("PASSWORD_FAILED") : invalidCredentials();
        }
        // 90일 미접속은 배치 없이 로그인할 때 판단한다.
        if (user.lastSeenAt() != null && user.lastSeenAt().isBefore(Instant.now().minus(DORMANT_AFTER))) {
            authUserMapper.lock(user.id(), "DORMANT");
            record(user.id(), email, "LOCKED", ip, userAgent);
            throw locked("DORMANT");
        }

        authUserMapper.recordSuccess(user.id());
        record(user.id(), email, "SUCCESS", ip, userAgent);
        return issue(user.id(), Instant.now().plus(rememberMe ? REFRESH_TTL_REMEMBER : REFRESH_TTL_SESSION),
                ip, userAgent);
    }

    // 쓰인 refresh 토큰은 바로 버리고 새로 발급한다. 만료 시각은 원래 로그인 기준을 유지한다.
    @Transactional
    public TokenPair refresh(String refreshToken, String ip, String userAgent) {
        RefreshToken stored = refreshTokenMapper.findByHash(Tokens.hash(refreshToken));
        if (stored == null || stored.expiresAt().isBefore(Instant.now())) {
            throw ApiException.unauthorized("REFRESH_INVALID", "다시 로그인해 주세요.");
        }
        refreshTokenMapper.deleteByHash(Tokens.hash(refreshToken));
        Credentials user = authUserMapper.findById(stored.userId());
        if (user == null || !user.isActive()) {
            throw ApiException.unauthorized("REFRESH_INVALID", "다시 로그인해 주세요.");
        }
        return issue(user.id(), stored.expiresAt(), ip, userAgent);
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenMapper.deleteByHash(Tokens.hash(refreshToken));
    }

    @PreAuthorize("isAuthenticated()")
    public Me me() {
        long id = CurrentUser.id();
        Profile profile = authUserMapper.findProfile(id);
        if (profile == null) {
            throw ApiException.unauthorized("USER_NOT_FOUND", "다시 로그인해 주세요.");
        }
        return new Me(profile.id(), profile.email(), profile.name(), profile.department(), profile.roleCode(),
                profile.roleName(), profile.isSuper(), profile.passwordChangeRequired(),
                authUserMapper.findAccessibleMenus(id));
    }

    // 요청마다 다시 읽어 잠금·역할 변경·권한 저장이 즉시 반영되게 한다.
    public List<String> authorities(long userId) {
        Credentials user = authUserMapper.findById(userId);
        if (user == null || !user.isActive()) {
            throw ApiException.unauthorized("ACCOUNT_NOT_ACTIVE", "다시 로그인해 주세요.");
        }
        // 임시 비밀번호를 쓰는 동안에는 비밀번호 변경 외에 아무것도 할 수 없다.
        if (user.passwordChangeRequired()) {
            return List.of("PASSWORD_CHANGE_REQUIRED");
        }
        return user.isSuper() ? List.of("SUPER") : authUserMapper.findAuthorities(userId);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public void changePassword(String currentPassword, String newPassword) {
        Credentials user = authUserMapper.findById(CurrentUser.id());
        if (user == null || user.passwordHash() == null
                || !passwordEncoder.matches(currentPassword, user.passwordHash())) {
            throw ApiException.unauthorized("INVALID_CREDENTIALS", "현재 비밀번호가 맞지 않습니다.");
        }
        if (newPassword == null || newPassword.length() < MIN_PASSWORD_LENGTH) {
            throw ApiException.badRequest("PASSWORD_TOO_SHORT",
                    "비밀번호는 " + MIN_PASSWORD_LENGTH + "자 이상이어야 합니다.");
        }
        if (passwordEncoder.matches(newPassword, user.passwordHash())) {
            throw ApiException.badRequest("PASSWORD_UNCHANGED", "지금 쓰는 비밀번호와 다른 값을 정해 주세요.");
        }
        authUserMapper.updatePassword(user.id(), passwordEncoder.encode(newPassword));
    }

    private TokenPair issue(long userId, Instant refreshExpiresAt, String ip, String userAgent) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(String.valueOf(userId))
                .issuedAt(now)
                .expiresAt(now.plus(ACCESS_TTL))
                .build();
        String accessToken = jwtEncoder
                .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();

        String refreshToken = Tokens.random();
        refreshTokenMapper.insert(userId, Tokens.hash(refreshToken), refreshExpiresAt, userAgent, ip);
        return new TokenPair(accessToken, refreshToken, ACCESS_TTL.toSeconds());
    }

    private void record(Long userId, String email, String result, String ip, String userAgent) {
        loginHistoryMapper.insert(userId, email, result, ip, userAgent);
    }

    private ApiException invalidCredentials() {
        return ApiException.unauthorized("INVALID_CREDENTIALS", "계정 또는 비밀번호가 맞지 않습니다.");
    }

    private ApiException locked(String reason) {
        String detail = "DORMANT".equals(reason)
                ? "90일 동안 접속하지 않아 잠긴 계정입니다. 권한 관리자에게 잠금 해제를 요청하세요."
                : "비밀번호를 5회 틀려 잠긴 계정입니다. 권한 관리자에게 잠금 해제를 요청하세요.";
        ApiException exception = ApiException.unauthorized("ACCOUNT_LOCKED", detail);
        exception.getBody().setProperty("lockReason", reason);
        return exception;
    }

}
