package com.hoka.bo.user;

import java.time.Instant;

public record UserDetail(
        long id,
        String email,
        String name,
        String department,
        String roleCode,
        String roleName,
        String status,
        String lockReason,
        Instant lockedAt,
        Instant lastLoginAt,
        Instant passwordChangedAt,
        boolean passwordChangeRequired,
        Instant createdAt,
        String invitedByName,
        Instant avatarUpdatedAt) {
}
