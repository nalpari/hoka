package com.hoka.bo.menu;

import java.util.List;
import java.util.Objects;

import com.hoka.bo.common.ApiException;
import com.hoka.bo.role.RoleMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MenuService {

    // 이 메뉴를 지우거나 숨기면 메뉴 관리 화면으로 돌아올 길이 사라진다.
    private static final String SELF = "SYS_MENUS";

    private final MenuMapper menuMapper;
    private final RoleMapper roleMapper;

    public MenuService(MenuMapper menuMapper, RoleMapper roleMapper) {
        this.menuMapper = menuMapper;
        this.roleMapper = roleMapper;
    }

    // 권한 격자의 행. 그룹과 메뉴가 한 목록에 들어 있고 정렬은 트리 순서다.
    @PreAuthorize("hasAnyAuthority('SUPER', 'SYS_ROLES:R', 'SYS_MENUS:R')")
    public List<Menu> findAll() {
        return menuMapper.findAll();
    }

    @PreAuthorize("hasAuthority('SUPER')")
    @Transactional
    public Menu create(Menu requested) {
        if (menuMapper.findByCode(requested.code()) != null) {
            throw ApiException.conflict("MENU_CODE_DUPLICATE", "이미 있는 메뉴 코드입니다: " + requested.code());
        }
        Menu menu = normalize(requested);
        validate(menu);
        menuMapper.insert(new Menu(menu.code(), menu.parentCode(), menu.name(), menu.path(), menu.icon(),
                menu.description(), menuMapper.nextSortOrder(menu.parentCode()), menu.visible(),
                menu.useCreate(), menu.useRead(), menu.useUpdate(), menu.useDelete(), menu.exclusiveRoleCode()));
        return menuMapper.findByCode(menu.code());
    }

    @PreAuthorize("hasAuthority('SUPER')")
    @Transactional
    public Menu update(String code, Menu requested) {
        Menu current = required(code);
        // 그룹을 메뉴로, 메뉴를 그룹으로 바꾸는 일은 없다. 새로 만들고 옮기는 편이 안전하다.
        if (current.isGroup() != (requested.parentCode() == null)) {
            throw ApiException.badRequest("MENU_KIND_IMMUTABLE",
                    "그룹과 메뉴는 서로 바꿀 수 없습니다. 새로 만든 뒤 옮기세요.");
        }
        Menu menu = normalize(new Menu(code, requested.parentCode(), requested.name(), requested.path(),
                requested.icon(), requested.description(), current.sortOrder(), requested.visible(),
                requested.useCreate(), requested.useRead(), requested.useUpdate(), requested.useDelete(),
                requested.exclusiveRoleCode()));
        validate(menu);
        // 조회를 끄면 슈퍼관리자의 canRead도 함께 꺼져(findAccessibleMenus가 use_read를 쓴다)
        // 메뉴 관리 화면으로 돌아올 길이 사라진다. 숨기는 것과 같은 자물쇠다.
        if (SELF.equals(code) && (!menu.visible() || !menu.useRead())) {
            throw ApiException.badRequest("MENU_SELF_HIDDEN", "메뉴 관리 자신은 숨기거나 조회를 끌 수 없습니다.");
        }
        // 그룹이 바뀌면 옮겨 간 그룹의 맨 뒤에 붙인다.
        if (!Objects.equals(current.parentCode(), menu.parentCode())) {
            menuMapper.updateSortOrder(code, menuMapper.nextSortOrder(menu.parentCode()));
        }
        menuMapper.update(menu);
        return menuMapper.findByCode(code);
    }

    @PreAuthorize("hasAuthority('SUPER')")
    @Transactional
    public void delete(String code) {
        Menu menu = required(code);
        if (SELF.equals(code)) {
            throw ApiException.badRequest("MENU_SELF_DELETE", "메뉴 관리 자신은 삭제할 수 없습니다.");
        }
        if (menu.isGroup() && menuMapper.countChildren(code) > 0) {
            throw ApiException.conflict("MENU_HAS_CHILDREN", "하위 메뉴가 있는 그룹은 삭제할 수 없습니다.");
        }
        // 권한이 조용히 사라지지 않도록, 역할에서 먼저 빼게 한다(RoleService.delete와 같은 태도).
        if (!menu.isGroup() && menuMapper.countGrants(code) > 0) {
            throw ApiException.conflict("MENU_IN_USE", "이 메뉴에 권한을 가진 역할이 있습니다. 권한 관리에서 먼저 빼세요.");
        }
        menuMapper.delete(code);
    }

    /** 같은 부모 안에서 위/아래 이웃과 순서를 맞바꾼다. 끝이면 아무것도 하지 않는다. */
    @PreAuthorize("hasAuthority('SUPER')")
    @Transactional
    public void move(String code, boolean up) {
        Menu menu = required(code);
        List<Menu> siblings = menuMapper.findAll().stream()
                .filter(sibling -> Objects.equals(sibling.parentCode(), menu.parentCode()))
                .toList();
        int at = siblings.stream().map(Menu::code).toList().indexOf(code);
        int to = up ? at - 1 : at + 1;
        if (to < 0 || to >= siblings.size()) {
            return;
        }
        Menu neighbour = siblings.get(to);
        menuMapper.updateSortOrder(code, neighbour.sortOrder());
        menuMapper.updateSortOrder(neighbour.code(), menu.sortOrder());
    }

    // 그룹은 경로도 아이콘도 동작도 갖지 않는다(DB의 check 제약과 같은 규칙).
    private Menu normalize(Menu menu) {
        String description = blankToNull(menu.description());
        if (menu.parentCode() == null) {
            return new Menu(menu.code(), null, menu.name(), null, null, description,
                    menu.sortOrder(), menu.visible(), false, false, false, false, null);
        }
        return new Menu(menu.code(), menu.parentCode(), menu.name(), blankToNull(menu.path()),
                blankToNull(menu.icon()), description, menu.sortOrder(), menu.visible(),
                menu.useCreate(), menu.useRead(), menu.useUpdate(), menu.useDelete(),
                blankToNull(menu.exclusiveRoleCode()));
    }

    private void validate(Menu menu) {
        if (menu.isGroup()) {
            return;
        }
        Menu parent = menuMapper.findByCode(menu.parentCode());
        if (parent == null || !parent.isGroup()) {
            throw ApiException.badRequest("MENU_PARENT_INVALID", "상위 메뉴는 그룹이어야 합니다: " + menu.parentCode());
        }
        if (menu.path() == null || !menu.path().matches("/[a-z0-9][a-z0-9/-]*")) {
            throw ApiException.badRequest("VALIDATION", "경로는 /로 시작하는 소문자·숫자·하이픈이어야 합니다.");
        }
        Menu owner = menuMapper.findByPath(menu.path());
        if (owner != null && !owner.code().equals(menu.code())) {
            throw ApiException.conflict("MENU_PATH_DUPLICATE", owner.name() + "이(가) 이미 쓰는 경로입니다: " + menu.path());
        }
        if (menu.exclusiveRoleCode() != null && roleMapper.findByCode(menu.exclusiveRoleCode()) == null) {
            throw ApiException.badRequest("ROLE_NOT_FOUND", "없는 역할입니다: " + menu.exclusiveRoleCode());
        }
        // 조회를 쓰지 않는 메뉴에는 권한을 줄 수 없어 역할에서 아예 보이지 않는다.
        if (!menu.useRead() && (menu.useCreate() || menu.useUpdate() || menu.useDelete())) {
            throw ApiException.badRequest("USE_READ_REQUIRED", "등록·수정·삭제를 쓰는 메뉴는 조회도 써야 합니다.");
        }
    }

    private Menu required(String code) {
        Menu menu = menuMapper.findByCode(code);
        if (menu == null) {
            throw ApiException.notFound("MENU_NOT_FOUND", "없는 메뉴입니다: " + code);
        }
        return menu;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

}
