package com.hoka.bo.auth;

import java.time.Instant;

// 지역(서울)은 GeoIP가 필요해 남기지 않는다. 브라우저 이름은 프론트가 userAgent에서 뽑는다.
public record LoginHistory(
        long id,
        Long userId,
        String email,
        String result,
        String ip,
        String userAgent,
        Instant createdAt) {
}
