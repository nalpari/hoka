package com.hoka.bo.auth;

import java.util.List;

public record Me(
        long id,
        String email,
        String name,
        String department,
        String roleCode,
        String roleName,
        boolean isSuper,
        boolean passwordChangeRequired,
        List<MenuAccess> menus) {
}
