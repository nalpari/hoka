package com.hoka.bo.role;

// 역할 목록의 한 줄. userCount는 "2명", grantedMenuCount는 "13/18"의 앞 숫자다.
public record RoleSummary(
        String code,
        String name,
        String description,
        boolean isSuper,
        int userCount,
        int grantedMenuCount) {
}
