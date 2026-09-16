package com.hoka.bo.role;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RoleMapper {

    List<RoleSummary> findAllSummaries();

    Role findByCode(String code);

    int insert(@Param("code") String code, @Param("name") String name, @Param("description") String description);

    int update(@Param("code") String code, @Param("name") String name, @Param("description") String description);

    int delete(String code);

    int touch(String code);

    List<MenuPermission> findPermissions(String roleCode);

    int deletePermissions(String roleCode);

    int insertPermissions(@Param("roleCode") String roleCode, @Param("permissions") List<MenuPermission> permissions);

    int countUsers(String roleCode);

    int countExclusiveMenus(String roleCode);

}
