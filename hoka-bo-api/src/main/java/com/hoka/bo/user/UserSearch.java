package com.hoka.bo.user;

import java.util.List;

// 목록 필터. size는 최대 100으로 자른다.
public record UserSearch(String q, List<String> statuses, String roleCode, String department, int page, int size) {

    public UserSearch {
        statuses = statuses == null ? List.of() : statuses;
        page = Math.max(page, 0);
        size = size <= 0 ? 20 : Math.min(size, 100);
    }

    public int offset() {
        return page * size;
    }

}
