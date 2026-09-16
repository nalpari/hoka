package com.hoka.bo.user;

import java.time.Instant;

// 사용자 목록 한 줄. lastAttempt는 성공·실패를 가리지 않은 마지막 로그인 시도다.
public record UserRow(
        long id,
        String email,
        String name,
        String department,
        String roleCode,
        String roleName,
        String status,
        Instant lastAttemptAt,
        String lastAttemptResult,
        Instant avatarUpdatedAt) {
}
