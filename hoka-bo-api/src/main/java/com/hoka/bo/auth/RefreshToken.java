package com.hoka.bo.auth;

import java.time.Instant;

public record RefreshToken(long id, long userId, Instant expiresAt) {
}
