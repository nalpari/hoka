package com.hoka.bo.common;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

// access 토큰의 sub가 곧 bo_user.id다. 자기 자신을 막는 규칙에 쓴다.
public final class CurrentUser {

    private CurrentUser() {
    }

    public static long id() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return -1;
        }
        try {
            return Long.parseLong(authentication.getName());
        } catch (NumberFormatException e) {
            // 토큰이 아닌 인증(테스트의 가짜 사용자 등)이면 어떤 사용자와도 일치하지 않는다.
            return -1;
        }
    }

}
