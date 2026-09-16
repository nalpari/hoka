package com.hoka.bo.auth;

import java.time.Instant;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RefreshTokenMapper {

    int insert(@Param("userId") long userId, @Param("tokenHash") String tokenHash,
            @Param("expiresAt") Instant expiresAt, @Param("userAgent") String userAgent, @Param("ip") String ip);

    // 조회와 삭제를 한 문장으로 한다. 동시에 같은 토큰이 들어와도 행을 지운 쪽만 결과를 받는다.
    RefreshToken consume(String tokenHash);

    int deleteByHash(String tokenHash);

    // 잠금·비활성화·비밀번호 초기화처럼 즉시 끊어야 할 때 쓴다.
    int deleteByUserIds(@Param("ids") List<Long> ids);

}
