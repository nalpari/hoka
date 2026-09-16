package com.hoka.bo.role;

// 격자 한 행의 체크 상태. 저장 요청과 조회 응답에 같은 모양을 쓴다.
public record MenuPermission(
        String menuCode,
        boolean canCreate,
        boolean canRead,
        boolean canUpdate,
        boolean canDelete) {

    public boolean isEmpty() {
        return !canCreate && !canRead && !canUpdate && !canDelete;
    }

}
