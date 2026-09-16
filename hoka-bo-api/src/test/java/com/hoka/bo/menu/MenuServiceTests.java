package com.hoka.bo.menu;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import com.hoka.bo.common.ApiException;
import com.hoka.bo.support.DatabaseTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

// 시드 데이터를 쓰고 테스트마다 롤백한다.
@Transactional
class MenuServiceTests extends DatabaseTest {

    @Autowired
    MenuService menus;

    @Test
    @WithMockUser(authorities = "SYS_ROLES:R")
    void returnsGroupsAndMenusWithTheirUsableActions() {
        List<Menu> all = menus.findAll();

        assertThat(all).filteredOn(Menu::isGroup).hasSize(6);
        assertThat(all).filteredOn(menu -> !menu.isGroup()).hasSize(18);

        Menu dashboard = find(all, "OPS_DASHBOARD");
        assertThat(dashboard.useRead()).isTrue();
        assertThat(dashboard.useCreate()).isFalse();
        assertThat(dashboard.icon()).isEqualTo("home");
    }

    @Test
    @WithMockUser(authorities = "SYS_USERS:R")
    void deniesReadWithoutRolesMenuPermission() {
        assertThatThrownBy(() -> menus.findAll()).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @WithMockUser(authorities = "SYS_MENUS:R")
    void deniesWritesToEveryoneButSuper() {
        assertThatThrownBy(() -> menus.delete("OPS_LIVE")).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @WithMockUser(authorities = "SUPER")
    void addsMenuAtTheEndOfItsGroup() {
        Menu created = menus.create(menu("SYS_JOBS", "SYS", "배치 작업", "/jobs"));

        assertThat(created.sortOrder()).isEqualTo(5);
        assertThat(created.icon()).isEqualTo("sliders");
    }

    @Test
    @WithMockUser(authorities = "SUPER")
    void rejectsPathAnotherMenuAlreadyUses() {
        assertThatThrownBy(() -> menus.create(menu("SYS_JOBS", "SYS", "배치 작업", "/roles")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("MENU_PATH_DUPLICATE"));
    }

    @Test
    @WithMockUser(authorities = "SUPER")
    void clearsPathAndActionsOnAGroup() {
        Menu group = menus.create(new Menu("OPSX", null, "운영 2", "/ignored", "home", null,
                0, true, true, true, true, true, null));

        assertThat(group.path()).isNull();
        assertThat(group.icon()).isNull();
        assertThat(group.useRead()).isFalse();
    }

    @Test
    @WithMockUser(authorities = "SUPER")
    void movingToAnotherGroupPutsItLast() {
        Menu moved = menus.update("OPS_LIVE", menu("OPS_LIVE", "MKT", "라이브 방송", "/live"));

        assertThat(moved.parentCode()).isEqualTo("MKT");
        assertThat(moved.sortOrder()).isEqualTo(3);
    }

    @Test
    @WithMockUser(authorities = "SUPER")
    void swapsOrderWithTheNeighbourAbove() {
        // 운영 그룹: 대시보드 1, 주문·배송 2, 클레임·반품 3 ...
        menus.move("OPS_CLAIMS", true);

        List<Menu> all = menus.findAll();
        assertThat(find(all, "OPS_CLAIMS").sortOrder()).isEqualTo(2);
        assertThat(find(all, "OPS_ORDERS").sortOrder()).isEqualTo(3);
    }

    @Test
    @WithMockUser(authorities = "SUPER")
    void movingPastTheEndChangesNothing() {
        menus.move("OPS_DASHBOARD", true);

        assertThat(find(menus.findAll(), "OPS_DASHBOARD").sortOrder()).isEqualTo(1);
    }

    @Test
    @WithMockUser(authorities = "SUPER")
    void keepsMenusThatRolesStillHavePermissionOn() {
        assertThatThrownBy(() -> menus.delete("OPS_ORDERS"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("MENU_IN_USE"));
    }

    @Test
    @WithMockUser(authorities = "SUPER")
    void keepsGroupsThatStillHaveMenus() {
        assertThatThrownBy(() -> menus.delete("SYS"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("MENU_HAS_CHILDREN"));
    }

    @Test
    @WithMockUser(authorities = "SUPER")
    void keepsTheMenuScreenReachable() {
        assertThatThrownBy(() -> menus.delete("SYS_MENUS"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("MENU_SELF_DELETE"));

        assertThatThrownBy(() -> menus.update("SYS_MENUS",
                new Menu("SYS_MENUS", "SYS", "메뉴 관리", "/menus", "sitemap", null,
                        0, false, true, true, true, true, "SUPER_ADMIN")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("MENU_SELF_HIDDEN"));
    }

    @Test
    @WithMockUser(authorities = "SUPER")
    void deletesAMenuNoRoleUses() {
        menus.delete("OPS_LIVE");

        assertThat(menus.findAll()).filteredOn(menu -> menu.code().equals("OPS_LIVE")).isEmpty();
    }

    private static Menu find(List<Menu> all, String code) {
        return all.stream().filter(menu -> menu.code().equals(code)).findFirst().orElseThrow();
    }

    private static Menu menu(String code, String parentCode, String name, String path) {
        return new Menu(code, parentCode, name, path, "sliders", null, 0, true,
                false, true, false, false, null);
    }

}
