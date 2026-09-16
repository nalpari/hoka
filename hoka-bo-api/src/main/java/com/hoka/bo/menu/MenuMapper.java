package com.hoka.bo.menu;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface MenuMapper {

    List<Menu> findAll();

    Menu findByCode(String code);

    Menu findByPath(String path);

    void insert(Menu menu);

    void update(Menu menu);

    void delete(String code);

    /** 같은 부모 안에서 마지막 순서 다음 값. 형제가 없으면 1이다. */
    int nextSortOrder(@Param("parentCode") String parentCode);

    void updateSortOrder(@Param("code") String code, @Param("sortOrder") int sortOrder);

    int countChildren(@Param("parentCode") String parentCode);

    /** 이 메뉴에 권한을 가진 역할 수. 남아 있으면 메뉴를 지우지 않는다. */
    int countGrants(@Param("menuCode") String menuCode);

}
