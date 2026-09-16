package com.hoka.bo.auth;

// 레일에 그릴 메뉴와 그 메뉴에서 할 수 있는 동작. groupName은 레일의 그룹 제목이다.
public record MenuAccess(
        String code,
        String parentCode,
        String groupName,
        String name,
        String path,
        String icon,
        boolean canCreate,
        boolean canRead,
        boolean canUpdate,
        boolean canDelete) {
}
