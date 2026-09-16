package com.hoka.bo.menu;

// parentCode가 null이면 그룹이고 path도 null이다. use* 는 이 메뉴가 실제로 쓰는 동작이다.
// icon은 레일이 그릴 아이콘 이름으로 그룹에는 없다.
// 조회 컬럼 순서가 곧 생성자 순서다(MyBatis 생성자 매핑).
public record Menu(
        String code,
        String parentCode,
        String name,
        String path,
        String icon,
        String description,
        int sortOrder,
        boolean visible,
        boolean useCreate,
        boolean useRead,
        boolean useUpdate,
        boolean useDelete,
        String exclusiveRoleCode) {

    public boolean isGroup() {
        return parentCode == null;
    }

    public boolean uses(String action) {
        return switch (action) {
            case "C" -> useCreate;
            case "R" -> useRead;
            case "U" -> useUpdate;
            case "D" -> useDelete;
            default -> false;
        };
    }

}
