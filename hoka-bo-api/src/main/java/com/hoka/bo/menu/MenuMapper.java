package com.hoka.bo.menu;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MenuMapper {

    List<Menu> findAll();

}
