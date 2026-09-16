package com.hoka.bo.auth;

// Me에서 메뉴를 뺀 조회 결과. 메뉴는 따로 읽어 AuthService가 합친다.
public record Profile(
        long id,
        String email,
        String name,
        String department,
        String roleCode,
        String roleName,
        boolean isSuper,
        boolean passwordChangeRequired) {
}
