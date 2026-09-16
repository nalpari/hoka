package com.hoka.bo.role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import com.hoka.bo.common.ApiException;
import com.hoka.bo.support.DatabaseTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

// 시드 데이터를 쓰고 테스트마다 롤백한다.
@Transactional
@WithMockUser(authorities = "SUPER")
class RoleServiceTests extends DatabaseTest {

    @Autowired
    RoleService roles;

    @Autowired
    JdbcClient jdbc;

    @Test
    void countsUsersAndGrantedMenus() {
        RoleSummary opsAdmin = roles.findAll().stream()
                .filter(r -> r.code().equals("OPS_ADMIN")).findFirst().orElseThrow();

        assertThat(opsAdmin.grantedMenuCount()).isEqualTo(13);
        assertThat(opsAdmin.userCount()).isZero();
    }

    @Test
    void replacesWholeGrid() {
        roles.replacePermissions("VIEWER", List.of(permission("OPS_ORDERS", false, true, false, false)));

        assertThat(roles.findPermissions("VIEWER"))
                .containsExactly(permission("OPS_ORDERS", false, true, false, false));
    }

    @Test
    void dropsRowsWithNothingChecked() {
        roles.replacePermissions("VIEWER", List.of(permission("OPS_ORDERS", false, false, false, false)));

        assertThat(roles.findPermissions("VIEWER")).isEmpty();
    }

    @Test
    void rejectsActionTheMenuDoesNotUse() {
        // 대시보드는 조회만 쓴다.
        assertThatThrownBy(() -> roles.replacePermissions("VIEWER",
                List.of(permission("OPS_DASHBOARD", true, true, false, false))))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("ACTION_NOT_SUPPORTED"));
    }

    @Test
    void rejectsWriteWithoutRead() {
        assertThatThrownBy(() -> roles.replacePermissions("VIEWER",
                List.of(permission("OPS_ORDERS", false, false, true, false))))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("READ_REQUIRED"));
    }

    @Test
    void rejectsGroupRow() {
        assertThatThrownBy(() -> roles.replacePermissions("VIEWER",
                List.of(permission("OPS", false, true, false, false))))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("MENU_IS_GROUP"));
    }

    @Test
    void rejectsExclusiveMenuForAnotherRole() {
        // 세금계산서는 정산 담당 전용이다.
        assertThatThrownBy(() -> roles.replacePermissions("CS",
                List.of(permission("STL_TAX", false, true, false, false))))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("MENU_EXCLUSIVE"));
    }

    @Test
    void allowsExclusiveMenuForItsOwnRole() {
        roles.replacePermissions("SETTLEMENT", List.of(permission("STL_TAX", true, true, true, false)));

        assertThat(roles.findPermissions("SETTLEMENT"))
                .containsExactly(permission("STL_TAX", true, true, true, false));
    }

    @Test
    void refusesToChangeSuperRole() {
        assertThatThrownBy(() -> roles.replacePermissions("SUPER_ADMIN", List.of()))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("SUPER_ROLE_IMMUTABLE"));
        assertThatThrownBy(() -> roles.delete("SUPER_ADMIN"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("SUPER_ROLE_IMMUTABLE"));
    }

    @Test
    void refusesToDeleteRoleWithUsers() {
        jdbc.sql("""
                insert into bo_user (email, name, role_code, status, password_hash)
                values ('test@hoka.co.kr', '테스트', 'CS', 'ACTIVE', 'x')
                """).update();

        assertThatThrownBy(() -> roles.delete("CS"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("ROLE_IN_USE"));
    }

    @Test
    void refusesToDeleteRoleOwningAnExclusiveMenu() {
        assertThatThrownBy(() -> roles.delete("SETTLEMENT"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("ROLE_EXCLUSIVE_MENU"));
    }

    @Test
    void deletesUnusedRoleWithItsPermissions() {
        roles.create("TEMP", "임시", null);
        roles.replacePermissions("TEMP", List.of(permission("OPS_ORDERS", false, true, false, false)));

        roles.delete("TEMP");

        assertThat(roles.findAll()).noneMatch(r -> r.code().equals("TEMP"));
        assertThat(jdbc.sql("select count(*) from bo_role_menu where role_code = 'TEMP'")
                .query(Long.class).single()).isZero();
    }

    @Test
    @WithMockUser(authorities = "SYS_ROLES:R")
    void deniesWritesWithoutSuperAuthority() {
        assertThat(roles.findAll()).isNotEmpty();
        assertThatThrownBy(() -> roles.delete("VIEWER")).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> roles.replacePermissions("VIEWER", List.of()))
                .isInstanceOf(AccessDeniedException.class);
    }

    private static MenuPermission permission(String menuCode, boolean c, boolean r, boolean u, boolean d) {
        return new MenuPermission(menuCode, c, r, u, d);
    }

}
