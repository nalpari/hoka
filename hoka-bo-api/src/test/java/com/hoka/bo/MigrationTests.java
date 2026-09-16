package com.hoka.bo;

import static org.assertj.core.api.Assertions.assertThat;

import com.hoka.bo.support.DatabaseTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;

// 시드가 시안과 맞는지 확인한다. 역할 목록의 "13/18" 같은 숫자가 근거다.
class MigrationTests extends DatabaseTest {

    @Autowired
    JdbcClient jdbc;

    @Test
    void seedsRolesAndMenus() {
        assertThat(count("select count(*) from bo_role")).isEqualTo(7);
        assertThat(count("select count(*) from bo_menu where parent_code is null")).isEqualTo(6);
        assertThat(count("select count(*) from bo_menu where parent_code is not null")).isEqualTo(18);
        assertThat(count("select count(*) from bo_role_menu where role_code = 'OPS_ADMIN'")).isEqualTo(13);
        assertThat(count("select count(*) from bo_role_menu where role_code = 'SUPER_ADMIN'")).isZero();
    }

    @Test
    void marksExclusiveMenus() {
        assertThat(jdbc.sql("select exclusive_role_code from bo_menu where code = 'STL_TAX'")
                .query(String.class).single()).isEqualTo("SETTLEMENT");
        assertThat(count("select count(*) from bo_menu where exclusive_role_code = 'SUPER_ADMIN'")).isEqualTo(3);
    }

    private long count(String sql) {
        return jdbc.sql(sql).query(Long.class).single();
    }

}
