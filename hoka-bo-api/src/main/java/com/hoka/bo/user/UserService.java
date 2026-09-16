package com.hoka.bo.user;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.hoka.bo.auth.LoginHistory;
import com.hoka.bo.auth.LoginHistoryMapper;
import com.hoka.bo.auth.RefreshTokenMapper;
import com.hoka.bo.common.ApiException;
import com.hoka.bo.common.CurrentUser;
import com.hoka.bo.common.Tokens;
import com.hoka.bo.role.RoleMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserService {

    static final Duration INVITE_VALIDITY = Duration.ofHours(24);
    static final int MIN_PASSWORD_LENGTH = 8;

    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final LoginHistoryMapper loginHistoryMapper;
    private final RefreshTokenMapper refreshTokenMapper;
    private final PasswordEncoder passwordEncoder;
    private final String frontBaseUrl;

    public UserService(UserMapper userMapper, RoleMapper roleMapper, LoginHistoryMapper loginHistoryMapper,
            RefreshTokenMapper refreshTokenMapper, PasswordEncoder passwordEncoder,
            @Value("${hoka.front.base-url}") String frontBaseUrl) {
        this.userMapper = userMapper;
        this.roleMapper = roleMapper;
        this.loginHistoryMapper = loginHistoryMapper;
        this.refreshTokenMapper = refreshTokenMapper;
        this.passwordEncoder = passwordEncoder;
        this.frontBaseUrl = frontBaseUrl;
    }

    @PreAuthorize("hasAnyAuthority('SUPER', 'SYS_USERS:R')")
    public UserPage search(UserSearch search) {
        Map<String, Integer> counts = userMapper.countByStatus().stream()
                .collect(Collectors.toMap(StatusCount::status, StatusCount::count));
        return new UserPage(userMapper.search(search), userMapper.countSearch(search), counts);
    }

    @PreAuthorize("hasAnyAuthority('SUPER', 'SYS_USERS:R')")
    public UserDetail find(long id) {
        return required(id);
    }

    @PreAuthorize("hasAnyAuthority('SUPER', 'SYS_USERS:R')")
    public List<String> findDepartments() {
        return userMapper.findDepartments();
    }

    @PreAuthorize("hasAnyAuthority('SUPER', 'SYS_USERS:R')")
    public List<LoginHistory> findLoginHistory(long id, int limit) {
        required(id);
        return loginHistoryMapper.findRecent(id, limit <= 0 ? 20 : Math.min(limit, 100));
    }

    // 메일 발송이 없어 초대 링크를 응답으로 돌려준다.
    @PreAuthorize("hasAuthority('SUPER')")
    @Transactional
    public Invitation invite(String email, String name, String department, String roleCode) {
        if (userMapper.existsByEmail(email)) {
            throw ApiException.conflict("EMAIL_DUPLICATE", "이미 있는 이메일입니다: " + email);
        }
        existingRole(roleCode);
        String token = Tokens.random();
        long userId = userMapper.insertInvited(email, name, department, roleCode, Tokens.hash(token),
                Instant.now().plus(INVITE_VALIDITY), inviterId());
        return new Invitation(userId, inviteUrl(token));
    }

    @PreAuthorize("hasAuthority('SUPER')")
    @Transactional
    public Invitation reinvite(long id) {
        if (!"INVITED".equals(statusOf(id))) {
            throw ApiException.conflict("NOT_INVITED", "초대 대기 상태의 사용자만 다시 초대할 수 있습니다.");
        }
        String token = Tokens.random();
        userMapper.updateInviteToken(id, Tokens.hash(token), Instant.now().plus(INVITE_VALIDITY));
        return new Invitation(id, inviteUrl(token));
    }

    // 로그인 전에 초대 링크가 살아 있는지 확인한다.
    public InvitationInfo findInvitation(String token) {
        InvitationInfo invitation = userMapper.findInvitation(Tokens.hash(token), Instant.now());
        if (invitation == null) {
            throw ApiException.badRequest("INVITE_INVALID", "만료되었거나 이미 사용한 초대 링크입니다.");
        }
        return invitation;
    }

    @Transactional
    public void acceptInvite(String token, String password) {
        Long id = userMapper.findIdByInviteToken(Tokens.hash(token), Instant.now());
        if (id == null) {
            throw ApiException.badRequest("INVITE_INVALID", "만료되었거나 이미 사용한 초대 링크입니다.");
        }
        checkPassword(password);
        userMapper.acceptInvite(id, passwordEncoder.encode(password));
    }

    @PreAuthorize("hasAuthority('SUPER')")
    @Transactional
    public UserDetail update(long id, String name, String department, String roleCode) {
        UserDetail user = required(id);
        existingRole(roleCode);
        if (!user.roleCode().equals(roleCode)) {
            checkNotSelf(id, "SELF_ROLE_CHANGE", "자기 역할은 바꿀 수 없습니다.");
            checkSuperAdminRemains(List.of(id));
        }
        userMapper.updateProfile(id, name, department, roleCode);
        return required(id);
    }

    @PreAuthorize("hasAuthority('SUPER')")
    @Transactional
    public void changeRole(List<Long> ids, String roleCode) {
        existingRole(roleCode);
        ids.forEach(id -> checkNotSelf(id, "SELF_ROLE_CHANGE", "자기 역할은 바꿀 수 없습니다."));
        checkSuperAdminRemains(ids);
        userMapper.changeRole(ids, roleCode);
    }

    @PreAuthorize("hasAuthority('SUPER')")
    @Transactional
    public void deactivate(List<Long> ids) {
        ids.forEach(id -> checkNotSelf(id, "SELF_DEACTIVATION", "자기 계정은 비활성화할 수 없습니다."));
        checkSuperAdminRemains(ids);
        userMapper.deactivate(ids);
        refreshTokenMapper.deleteByUserIds(ids);
    }

    @PreAuthorize("hasAuthority('SUPER')")
    @Transactional
    public String unlock(long id) {
        if (!"LOCKED".equals(statusOf(id))) {
            throw ApiException.conflict("NOT_LOCKED", "잠긴 계정이 아닙니다.");
        }
        String temporary = Tokens.temporaryPassword();
        userMapper.unlock(id, passwordEncoder.encode(temporary));
        refreshTokenMapper.deleteByUserIds(List.of(id));
        return temporary;
    }

    @PreAuthorize("hasAuthority('SUPER')")
    @Transactional
    public String resetPassword(long id) {
        if ("INVITED".equals(statusOf(id))) {
            throw ApiException.conflict("NOT_INVITED", "초대 대기 계정은 비밀번호를 초기화할 수 없습니다. 다시 초대하세요.");
        }
        String temporary = Tokens.temporaryPassword();
        userMapper.resetPassword(id, passwordEncoder.encode(temporary));
        refreshTokenMapper.deleteByUserIds(List.of(id));
        return temporary;
    }

    private void checkPassword(String password) {
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) {
            throw ApiException.badRequest("PASSWORD_TOO_SHORT",
                    "비밀번호는 " + MIN_PASSWORD_LENGTH + "자 이상이어야 합니다.");
        }
    }

    private void checkNotSelf(long id, String code, String detail) {
        if (id == CurrentUser.id()) {
            throw ApiException.conflict(code, detail);
        }
    }

    // 마지막 슈퍼관리자를 비활성화하거나 강등하면 아무도 권한을 되돌릴 수 없다.
    // 원래 활성 슈퍼관리자가 없는 상태(부트스트랩 전)까지 막지는 않는다.
    private void checkSuperAdminRemains(List<Long> ids) {
        if (userMapper.countActiveSupersExcept(List.of()) > 0 && userMapper.countActiveSupersExcept(ids) == 0) {
            throw ApiException.conflict("LAST_SUPER_ADMIN", "마지막 슈퍼관리자는 비활성화하거나 역할을 바꿀 수 없습니다.");
        }
    }

    private void existingRole(String roleCode) {
        if (roleMapper.findByCode(roleCode) == null) {
            throw ApiException.badRequest("ROLE_NOT_FOUND", "없는 역할입니다: " + roleCode);
        }
    }

    private String statusOf(long id) {
        return required(id).status();
    }

    private UserDetail required(long id) {
        UserDetail user = userMapper.findDetail(id);
        if (user == null) {
            throw ApiException.notFound("USER_NOT_FOUND", "없는 사용자입니다: " + id);
        }
        return user;
    }

    private Long inviterId() {
        long id = CurrentUser.id();
        return id > 0 ? id : null;
    }

    private String inviteUrl(String token) {
        return frontBaseUrl + "/invite/" + token;
    }

}
