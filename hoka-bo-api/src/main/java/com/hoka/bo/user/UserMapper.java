package com.hoka.bo.user;

import java.time.Instant;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {

    List<UserRow> search(@Param("s") UserSearch search);

    int countSearch(@Param("s") UserSearch search);

    List<StatusCount> countByStatus();

    UserDetail findDetail(long id);

    List<String> findDepartments();

    long insertInvited(@Param("email") String email, @Param("name") String name,
            @Param("department") String department, @Param("roleCode") String roleCode,
            @Param("tokenHash") String tokenHash, @Param("expiresAt") Instant expiresAt,
            @Param("invitedBy") Long invitedBy);

    boolean existsByEmail(String email);

    int updateInviteToken(@Param("id") long id, @Param("tokenHash") String tokenHash,
            @Param("expiresAt") Instant expiresAt);

    Long findIdByInviteToken(@Param("tokenHash") String tokenHash, @Param("now") Instant now);

    int acceptInvite(@Param("id") long id, @Param("passwordHash") String passwordHash);

    int updateProfile(@Param("id") long id, @Param("name") String name,
            @Param("department") String department, @Param("roleCode") String roleCode);

    int changeRole(@Param("ids") List<Long> ids, @Param("roleCode") String roleCode);

    int deactivate(@Param("ids") List<Long> ids);

    int unlock(@Param("id") long id, @Param("passwordHash") String passwordHash);

    int resetPassword(@Param("id") long id, @Param("passwordHash") String passwordHash);

    // 잠금·비활성화·역할 변경 뒤에도 슈퍼관리자가 한 명은 남아야 한다.
    int countActiveSupersExcept(@Param("ids") List<Long> ids);

}
