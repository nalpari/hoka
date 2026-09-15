package com.hoka.bo.sample;

import java.time.OffsetDateTime;

public record Sample(Long id, String name, OffsetDateTime createdAt) {
}
