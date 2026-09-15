package com.hoka.batch.sample;

import java.time.OffsetDateTime;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface SampleMapper {

    /** created_at이 [from, to) 구간인 sample 건수. */
    long countCreatedBetween(@Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

}
