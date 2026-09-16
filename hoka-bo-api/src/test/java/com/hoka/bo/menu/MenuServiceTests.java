package com.hoka.bo.menu;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import com.hoka.bo.support.DatabaseTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.test.context.support.WithMockUser;

class MenuServiceTests extends DatabaseTest {

    @Autowired
    MenuService menus;

    @Test
    @WithMockUser(authorities = "SYS_ROLES:R")
    void returnsGroupsAndMenusWithTheirUsableActions() {
        List<Menu> all = menus.findAll();

        assertThat(all).filteredOn(Menu::isGroup).hasSize(6);
        assertThat(all).filteredOn(menu -> !menu.isGroup()).hasSize(18);

        Menu dashboard = all.stream().filter(m -> m.code().equals("OPS_DASHBOARD")).findFirst().orElseThrow();
        assertThat(dashboard.useRead()).isTrue();
        assertThat(dashboard.useCreate()).isFalse();
    }

    @Test
    @WithMockUser(authorities = "SYS_USERS:R")
    void deniesReadWithoutRolesMenuPermission() {
        assertThatThrownBy(() -> menus.findAll()).isInstanceOf(AccessDeniedException.class);
    }

}
