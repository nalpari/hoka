package com.hoka.bo.role;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.hoka.bo.common.ApiException;
import com.hoka.bo.menu.Menu;
import com.hoka.bo.menu.MenuMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class RoleService {

    private final RoleMapper roleMapper;
    private final MenuMapper menuMapper;

    public RoleService(RoleMapper roleMapper, MenuMapper menuMapper) {
        this.roleMapper = roleMapper;
        this.menuMapper = menuMapper;
    }

    @PreAuthorize("hasAnyAuthority('SUPER', 'SYS_ROLES:R')")
    public List<RoleSummary> findAll() {
        return roleMapper.findAllSummaries();
    }

    @PreAuthorize("hasAnyAuthority('SUPER', 'SYS_ROLES:R')")
    public Role find(String code) {
        return required(code);
    }

    @PreAuthorize("hasAnyAuthority('SUPER', 'SYS_ROLES:R')")
    public List<MenuPermission> findPermissions(String code) {
        required(code);
        return roleMapper.findPermissions(code);
    }

    @PreAuthorize("hasAuthority('SUPER')")
    @Transactional
    public Role create(String code, String name, String description) {
        if (roleMapper.findByCode(code) != null) {
            throw ApiException.conflict("ROLE_CODE_DUPLICATE", "이미 있는 역할 코드입니다: " + code);
        }
        roleMapper.insert(code, name, description);
        return roleMapper.findByCode(code);
    }

    @PreAuthorize("hasAuthority('SUPER')")
    @Transactional
    public Role update(String code, String name, String description) {
        mutable(code);
        roleMapper.update(code, name, description);
        return roleMapper.findByCode(code);
    }

    @PreAuthorize("hasAuthority('SUPER')")
    @Transactional
    public void delete(String code) {
        mutable(code);
        // 소속 사용자를 다른 역할로 옮기기 전에는 지우지 못한다. 권한이 조용히 바뀌는 것을 막는다.
        if (roleMapper.countUsers(code) > 0) {
            throw ApiException.conflict("ROLE_IN_USE", "소속 사용자가 있는 역할은 삭제할 수 없습니다.");
        }
        if (roleMapper.countExclusiveMenus(code) > 0) {
            throw ApiException.conflict("ROLE_EXCLUSIVE_MENU", "이 역할 전용 메뉴가 있어 삭제할 수 없습니다.");
        }
        roleMapper.delete(code);
    }

    // 격자를 통째로 교체한다. 체크가 하나도 없는 행은 저장하지 않는다.
    @PreAuthorize("hasAuthority('SUPER')")
    @Transactional
    public List<MenuPermission> replacePermissions(String code, List<MenuPermission> permissions) {
        mutable(code);
        Map<String, Menu> menus = menuMapper.findAll().stream()
                .collect(Collectors.toMap(Menu::code, Function.identity()));
        List<MenuPermission> rows = permissions.stream().filter(p -> !p.isEmpty()).toList();
        rows.forEach(p -> validate(code, p, menus.get(p.menuCode())));

        roleMapper.deletePermissions(code);
        if (!rows.isEmpty()) {
            roleMapper.insertPermissions(code, rows);
        }
        roleMapper.touch(code);
        return roleMapper.findPermissions(code);
    }

    private void validate(String roleCode, MenuPermission permission, Menu menu) {
        if (menu == null) {
            throw ApiException.badRequest("MENU_NOT_FOUND", "없는 메뉴입니다: " + permission.menuCode());
        }
        if (menu.isGroup()) {
            throw ApiException.badRequest("MENU_IS_GROUP", "그룹에는 권한을 줄 수 없습니다: " + menu.code());
        }
        if (menu.exclusiveRoleCode() != null && !menu.exclusiveRoleCode().equals(roleCode)) {
            throw ApiException.badRequest("MENU_EXCLUSIVE", menu.code() + "은(는) "
                    + menu.exclusiveRoleCode() + " 전용 메뉴입니다.");
        }
        if (!permission.canRead()) {
            throw ApiException.badRequest("READ_REQUIRED", "등록·수정·삭제 권한에는 조회 권한이 필요합니다: " + menu.code());
        }
        checkUses(menu, "C", permission.canCreate());
        checkUses(menu, "R", permission.canRead());
        checkUses(menu, "U", permission.canUpdate());
        checkUses(menu, "D", permission.canDelete());
    }

    private void checkUses(Menu menu, String action, boolean granted) {
        if (granted && !menu.uses(action)) {
            throw ApiException.badRequest("ACTION_NOT_SUPPORTED",
                    menu.code() + " 메뉴는 " + action + " 동작을 쓰지 않습니다.");
        }
    }

    private Role required(String code) {
        Role role = roleMapper.findByCode(code);
        if (role == null) {
            throw ApiException.notFound("ROLE_NOT_FOUND", "없는 역할입니다: " + code);
        }
        return role;
    }

    // 슈퍼관리자 역할은 항상 전부 허용이라 수정·삭제·권한 저장 대상이 아니다.
    private Role mutable(String code) {
        Role role = required(code);
        if (role.isSuper()) {
            throw ApiException.conflict("SUPER_ROLE_IMMUTABLE", "슈퍼관리자 역할은 바꿀 수 없습니다.");
        }
        return role;
    }

}
