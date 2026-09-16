package com.hoka.bo.user;

import java.util.List;
import java.util.Map;

// statusCounts는 필터와 무관한 전체 기준이다. 스코프바의 "활성 7 · 잠금 1"에 쓴다.
public record UserPage(List<UserRow> items, int total, Map<String, Integer> statusCounts) {
}
