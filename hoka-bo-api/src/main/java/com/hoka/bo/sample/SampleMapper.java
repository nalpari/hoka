package com.hoka.bo.sample;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SampleMapper {

    List<Sample> findAll();

    Sample findById(long id);

    Sample insert(String name);

    Sample update(long id, String name);

    int delete(long id);

}
