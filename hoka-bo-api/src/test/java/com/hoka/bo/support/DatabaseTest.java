package com.hoka.bo.support;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.postgresql.PostgreSQLContainer;

// 빈 PostgreSQL에 Flyway가 V1·V2를 적용한 상태로 테스트한다. 개발자 로컬 appdb는 건드리지 않는다.
// webEnvironment는 기본값(MOCK)이다. NONE으로 두면 SecurityConfig가 요구하는 HttpSecurity 빈이 없어 컨텍스트가 뜨지 않는다.
@SpringBootTest
@ActiveProfiles("test")
@Import(DatabaseTest.Containers.class)
public abstract class DatabaseTest {

    // 컨테이너를 빈으로 두면 수명이 스프링 컨텍스트를 따라간다. @Testcontainers의 static 필드 방식은
    // 첫 테스트 클래스가 끝날 때 컨테이너를 멈춰서 다음 클래스가 죽은 포트에 붙는다.
    @TestConfiguration(proxyBeanMethods = false)
    static class Containers {

        @Bean
        @ServiceConnection
        PostgreSQLContainer postgres() {
            return new PostgreSQLContainer("postgres:18-alpine");
        }

    }

}
