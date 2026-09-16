package com.hoka.bo.role;

import java.util.List;

import com.hoka.bo.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    public List<RoleSummary> list() {
        return roleService.findAll();
    }

    @GetMapping("/{code}")
    public RoleDetail get(@PathVariable String code) {
        return roleService.findDetail(code);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Role create(@RequestBody RoleRequest request) {
        request.validateForCreate();
        return roleService.create(request.code(), request.name(), request.description());
    }

    @PutMapping("/{code}")
    public Role update(@PathVariable String code, @RequestBody RoleRequest request) {
        request.validateName();
        return roleService.update(code, request.name(), request.description());
    }

    @DeleteMapping("/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String code) {
        roleService.delete(code);
    }

    @PutMapping("/{code}/permissions")
    public List<MenuPermission> replacePermissions(@PathVariable String code,
            @RequestBody List<MenuPermission> permissions) {
        return roleService.replacePermissions(code, permissions);
    }

    record RoleRequest(String code, String name, String description) {

        void validateForCreate() {
            if (code == null || !code.matches("[A-Z][A-Z0-9_]{1,39}")) {
                throw ApiException.badRequest("VALIDATION", "역할 코드는 대문자·숫자·밑줄로 2~40자여야 합니다.");
            }
            validateName();
        }

        void validateName() {
            if (name == null || name.isBlank()) {
                throw ApiException.badRequest("VALIDATION", "역할명을 입력해 주세요.");
            }
        }

    }

}
