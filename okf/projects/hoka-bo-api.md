---
type: Project
title: hoka-bo-api
description: 백오피스 Spring Boot 4 API 서버 (패키지 com.hoka.bo).
resource: ../../hoka-bo-api/
tags: [backend, bo, spring-boot, java]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-16T00:20:00Z }
sources:
  - id: pom
    resource: ../../hoka-bo-api/pom.xml
    title: pom.xml
  - id: app-yaml
    resource: ../../hoka-bo-api/src/main/resources/application.yaml
    title: application.yaml
  - id: security
    resource: ../../hoka-bo-api/src/main/java/com/hoka/bo/config/SecurityConfig.java
    title: SecurityConfig.java
---

# Stack

| 항목 | 값 |
|---|---|
| Framework | Spring Boot 4.1.1, Java 21, Maven Wrapper[^pom] |
| Starters | webmvc, security, actuator, devtools, mybatis-spring-boot-starter 4.1.0 (spring-boot-starter-jdbc 포함)[^pom] |
| DB driver | PostgreSQL (runtime) |
| Config | `application.yaml` — `spring.application.name`, `spring.datasource`, `mybatis`[^app-yaml] |
| Git | 루트 `hoka/` 저장소에 포함 (자체 `.git` 없음) |

# Commands

```bash
./mvnw spring-boot:run
./mvnw test
./mvnw test -Dtest=HokaBoApiApplicationTests#contextLoads
./mvnw package
```

# Notes

- DB 접속은 환경변수 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`로 받고, 없으면 `jdbc:postgresql://localhost:5432/appdb`, `app`/`app`를 쓴다.[^app-yaml]
- MyBatis: 매퍼 XML은 `classpath:mapper/**/*.xml`, `map-underscore-to-camel-case: true`. `@Mapper` 인터페이스는 애플리케이션 패키지 아래에서 자동 스캔한다(`@MapperScan` 없음).
- `config/SecurityConfig`: 모든 요청에 HTTP Basic 인증(Spring 기본 생성 사용자 `user`)을 요구하고, 세션을 만들지 않으며 CSRF는 끈다.[^security]
- 샘플 CRUD(`sample` 패키지, `mapper/SampleMapper.xml`, `SampleControllerTests`)는 삭제했다. 백오피스 인증·권한 기능을 시작하며 정리한 것으로, 남은 테스트는 `HokaBoApiApplicationTests` 하나다. FO에는 그대로 있다([Sample CRUD](/architecture/sample-crud.md)).
- 매퍼 XML이 없어 기동·테스트 때 `No MyBatis mapper was found` 경고가 난다. 첫 매퍼를 추가하면 사라진다.
- `server.port` 미설정 → 기본 8080. [hoka-fo-api](/projects/hoka-fo-api.md)와 동시 실행 시 포트 분리 필요.
- 소비자로 [hoka-bo-front](/projects/hoka-bo-front.md)를 가정한다. [System overview](/architecture/system-overview.md) 참고.

[^pom]: pom.xml
[^app-yaml]: application.yaml
[^security]: SecurityConfig.java
