package com.hoka.bo.role;

import java.util.List;

public record RoleDetail(Role role, List<RoleMember> members, List<MenuPermission> permissions) {
}
