package com.hoka.bo.role;

// 역할 정보 패널의 "소속 사용자" 목록.
public record RoleMember(long id, String name, String department, String status) {
}
