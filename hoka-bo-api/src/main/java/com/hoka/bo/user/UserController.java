package com.hoka.bo.user;

import java.io.IOException;
import java.util.List;

import com.hoka.bo.auth.LoginHistory;
import com.hoka.bo.common.ApiException;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final AvatarService avatarService;

    public UserController(UserService userService, AvatarService avatarService) {
        this.userService = userService;
        this.avatarService = avatarService;
    }

    @GetMapping
    public UserPage list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) List<String> status,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String department,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return userService.search(new UserSearch(q, status, role, department, page, size));
    }

    @GetMapping("/departments")
    public List<String> departments() {
        return userService.findDepartments();
    }

    @GetMapping("/{id}")
    public UserDetail get(@PathVariable long id) {
        return userService.find(id);
    }

    @GetMapping("/{id}/login-history")
    public List<LoginHistory> loginHistory(@PathVariable long id, @RequestParam(defaultValue = "20") int limit) {
        return userService.findLoginHistory(id, limit);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Invitation invite(@RequestBody InviteRequest request) {
        request.validate();
        return userService.invite(request.email(), request.name(), request.department(), request.roleCode());
    }

    @PostMapping("/{id}/invitation")
    public Invitation reinvite(@PathVariable long id) {
        return userService.reinvite(id);
    }

    @PatchMapping("/{id}")
    public UserDetail update(@PathVariable long id, @RequestBody UpdateRequest request) {
        request.validate();
        return userService.update(id, request.name(), request.department(), request.roleCode());
    }

    @PostMapping("/{id}/unlock")
    public TemporaryPassword unlock(@PathVariable long id) {
        return new TemporaryPassword(userService.unlock(id));
    }

    @PostMapping("/{id}/password-reset")
    public TemporaryPassword resetPassword(@PathVariable long id) {
        return new TemporaryPassword(userService.resetPassword(id));
    }

    @PostMapping("/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@RequestBody IdsRequest request) {
        request.validate();
        userService.deactivate(request.ids());
    }

    @PatchMapping("/role")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeRole(@RequestBody RoleChangeRequest request) {
        request.validate();
        userService.changeRole(request.ids(), request.roleCode());
    }

    // 항상 128x128 PNG다(AvatarService가 정규화한다). 사진이 바뀌면 avatarUpdatedAt이 바뀌므로
    // 프론트가 그 값을 쿼리에 달아 캐시를 무효화한다.
    @GetMapping("/{id}/avatar")
    public ResponseEntity<byte[]> avatar(@PathVariable long id) {
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .cacheControl(CacheControl.noCache().cachePrivate())
                .body(avatarService.find(id));
    }

    @PostMapping("/{id}/avatar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void uploadAvatar(@PathVariable long id, @RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("VALIDATION", "사진 파일을 골라 주세요.");
        }
        try {
            avatarService.replace(id, file.getBytes());
        } catch (IOException e) {
            throw ApiException.badRequest("AVATAR_UNREADABLE", "사진을 읽지 못했습니다. 다시 시도해 주세요.");
        }
    }

    @DeleteMapping("/{id}/avatar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAvatar(@PathVariable long id) {
        avatarService.delete(id);
    }

    // 메일 발송이 없어 화면에 한 번 보여 주는 값이다.
    record TemporaryPassword(String temporaryPassword) {
    }

    record InviteRequest(String email, String name, String department, String roleCode) {

        void validate() {
            if (email == null || !email.contains("@") || name == null || name.isBlank()
                    || roleCode == null || roleCode.isBlank()) {
                throw ApiException.badRequest("VALIDATION", "이메일·이름·역할은 필수입니다.");
            }
        }

    }

    record UpdateRequest(String name, String department, String roleCode) {

        void validate() {
            if (name == null || name.isBlank() || roleCode == null || roleCode.isBlank()) {
                throw ApiException.badRequest("VALIDATION", "이름과 역할은 필수입니다.");
            }
        }

    }

    record IdsRequest(List<Long> ids) {

        void validate() {
            if (ids == null || ids.isEmpty()) {
                throw ApiException.badRequest("VALIDATION", "대상 사용자를 선택해 주세요.");
            }
        }

    }

    record RoleChangeRequest(List<Long> ids, String roleCode) {

        void validate() {
            if (ids == null || ids.isEmpty() || roleCode == null || roleCode.isBlank()) {
                throw ApiException.badRequest("VALIDATION", "대상 사용자와 역할을 선택해 주세요.");
            }
        }

    }

}
