package com.hoka.bo.auth;

import java.time.Instant;

// 로그인 판단에 필요한 최소 정보. 조회 컬럼 순서가 곧 생성자 순서다.
public record Credentials(
        long id,
        String email,
        String passwordHash,
        String status,
        String lockReason,
        int failedLoginCount,
        Instant lastLoginAt,
        Instant passwordChangedAt,
        boolean passwordChangeRequired,
        boolean isSuper) {

    public boolean isActive() {
        return "ACTIVE".equals(status);
    }

    public boolean isLocked() {
        return "LOCKED".equals(status);
    }

    // 한 번도 로그인하지 않았으면 비밀번호를 정한 시점부터 센다.
    public Instant lastSeenAt() {
        return lastLoginAt != null ? lastLoginAt : passwordChangedAt;
    }

}
