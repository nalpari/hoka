package com.hoka.bo.auth;

import java.time.Instant;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RefreshTokenMapper {

    int insert(@Param("userId") long userId, @Param("tokenHash") String tokenHash,
            @Param("expiresAt") Instant expiresAt, @Param("userAgent") String userAgent, @Param("ip") String ip);

    RefreshToken findByHash(String tokenHash);

    int deleteByHash(String tokenHash);

    // 잠금·비활성화·비밀번호 초기화처럼 즉시 끊어야 할 때 쓴다.
    int deleteByUserIds(@Param("ids") List<Long> ids);

}
