---
type: Project
title: hoka-fo-api
description: 프론트오피스 Spring Boot 4 API 서버 (패키지 com.hoka.fo).
resource: ../../hoka-fo-api/
tags: [backend, fo, spring-boot, java]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-15T05:25:00Z }
sources:
  - id: pom
    resource: ../../hoka-fo-api/pom.xml
    title: pom.xml
  - id: app-yaml
    resource: ../../hoka-fo-api/src/main/resources/application.yaml
    title: application.yaml
  - id: security
    resource: ../../hoka-fo-api/src/main/java/com/hoka/fo/config/SecurityConfig.java
    title: SecurityConfig.java
  - id: resilience-tests
    resource: ../../hoka-fo-api/src/test/java/com/hoka/fo/sample/SampleResilienceTests.java
    title: SampleResilienceTests.java
---

# Stack

| 항목 | 값 |
|---|---|
| Framework | Spring Boot 4.1.1, Java 21, Maven Wrapper[^pom] |
| Starters | webmvc, security, actuator, devtools, aspectj, mybatis-spring-boot-starter 4.1.0 (spring-boot-starter-jdbc 포함)[^pom] |
| Resilience | resilience4j-spring-boot4 2.4.0 (Retry, CircuitBreaker). [hoka-bo-api](/projects/hoka-bo-api.md)에는 없다[^pom] |
| DB driver | PostgreSQL (runtime) |
| Config | `application.yaml` — `spring.application.name`, `spring.datasource`, `mybatis`, `resilience4j`, `management`(health 상세·circuitbreakers)[^app-yaml] |
| Git | 루트 `hoka/` 저장소에 포함 (자체 `.git` 없음) |

# Commands

```bash
./mvnw spring-boot:run
./mvnw test
./mvnw test -Dtest=HokaFoApiApplicationTests#contextLoads
./mvnw package
```

# Notes

- DB 접속은 환경변수 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`로 받고, 없으면 `jdbc:postgresql://localhost:5432/appdb`, `app`/`app`를 쓴다.[^app-yaml]
- MyBatis: 매퍼 XML은 `classpath:mapper/**/*.xml`, `map-underscore-to-camel-case: true`. `@Mapper` 인터페이스는 애플리케이션 패키지 아래에서 자동 스캔한다(`@MapperScan` 없음).
- `config/SecurityConfig`: 모든 요청에 HTTP Basic 인증(Spring 기본 생성 사용자 `user`)을 요구하고, 세션을 만들지 않으며 CSRF는 끈다.[^security]
- 샘플 CRUD `/api/samples`(`sample` 테이블). 계약은 [Sample CRUD](/architecture/sample-crud.md). `./mvnw test`의 `SampleControllerTests`는 로컬 `appdb`가 떠 있어야 통과한다.
- 장애 대응: `GET /api/samples/{id}`에 Retry(3회)와 CircuitBreaker(인스턴스 `sample`)를 적용했고, DB 장애·차단 시 503을 반환한다. 규칙은 [Resilience4j](/conventions/resilience4j.md). `SampleResilienceTests`는 매퍼를 목으로 바꿔 DB 없이 돈다.[^resilience-tests]
- `server.port` 미설정 → 기본 8080. [hoka-bo-api](/projects/hoka-bo-api.md)와 동시 실행 시 포트 분리 필요.
- 소비자로 [hoka-fo-front](/projects/hoka-fo-front.md)를 가정한다. [System overview](/architecture/system-overview.md) 참고.

[^pom]: pom.xml
[^app-yaml]: application.yaml
[^security]: SecurityConfig.java
