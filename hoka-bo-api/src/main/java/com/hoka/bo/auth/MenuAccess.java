package com.hoka.bo.auth;

// 레일에 그릴 메뉴와 그 메뉴에서 할 수 있는 동작.
public record MenuAccess(
        String code,
        String parentCode,
        String name,
        String path,
        boolean canCreate,
        boolean canRead,
        boolean canUpdate,
        boolean canDelete) {
}
