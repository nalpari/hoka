package com.hoka.bo.auth;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface LoginHistoryMapper {

    int insert(@Param("userId") Long userId, @Param("email") String email, @Param("result") String result,
            @Param("ip") String ip, @Param("userAgent") String userAgent);

    List<LoginHistory> findRecent(@Param("userId") long userId, @Param("limit") int limit);

}
