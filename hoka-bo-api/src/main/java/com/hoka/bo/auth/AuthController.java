package com.hoka.bo.auth;

import com.hoka.bo.common.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public TokenPair login(@RequestBody LoginRequest request, HttpServletRequest http) {
        request.validate();
        return authService.login(request.email(), request.password(), request.rememberMe(),
                clientIp(http), http.getHeader("User-Agent"));
    }

    @PostMapping("/refresh")
    public TokenPair refresh(@RequestBody TokenRequest request, HttpServletRequest http) {
        request.validate();
        return authService.refresh(request.refreshToken(), clientIp(http), http.getHeader("User-Agent"));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestBody TokenRequest request) {
        request.validate();
        authService.logout(request.refreshToken());
    }

    @GetMapping("/me")
    public Me me() {
        return authService.me();
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@RequestBody PasswordRequest request) {
        authService.changePassword(request.currentPassword(), request.newPassword());
    }

    // 브라우저는 Next.js BFF를 거치므로 원래 IP는 BFF가 넘긴 헤더에 있다.
    private static String clientIp(HttpServletRequest http) {
        String forwarded = http.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return http.getRemoteAddr();
    }

    record LoginRequest(String email, String password, boolean rememberMe) {

        void validate() {
            if (email == null || email.isBlank() || password == null || password.isBlank()) {
                throw ApiException.badRequest("VALIDATION", "이메일과 비밀번호를 입력해 주세요.");
            }
        }

    }

    record TokenRequest(String refreshToken) {

        void validate() {
            if (refreshToken == null || refreshToken.isBlank()) {
                throw ApiException.badRequest("VALIDATION", "refreshToken이 필요합니다.");
            }
        }

    }

    record PasswordRequest(String currentPassword, String newPassword) {
    }

}
