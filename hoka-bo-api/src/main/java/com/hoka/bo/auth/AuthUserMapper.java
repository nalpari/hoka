package com.hoka.bo.auth;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AuthUserMapper {

    Credentials findByEmail(String email);

    Credentials findById(long id);

    int increaseFailedCount(long id);

    int lock(@Param("id") long id, @Param("reason") String reason);

    int recordSuccess(long id);

    int updatePassword(@Param("id") long id, @Param("passwordHash") String passwordHash);

    // 요청마다 다시 읽는다. 권한 저장·역할 변경이 즉시 반영되도록.
    List<String> findAuthorities(long id);

    List<MenuAccess> findAccessibleMenus(long id);

    Profile findProfile(long id);

}
