package com.hoka.bo.auth;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RefreshTokenMapper {

    // 잠금·비활성화·비밀번호 초기화처럼 즉시 끊어야 할 때 쓴다.
    int deleteByUserIds(@Param("ids") List<Long> ids);

}
