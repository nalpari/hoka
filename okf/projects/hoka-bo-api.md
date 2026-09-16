---
type: Project
title: hoka-bo-api
description: 백오피스 Spring Boot 4 API 서버 (패키지 com.hoka.bo).
resource: ../../hoka-bo-api/
tags: [backend, bo, spring-boot, java]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-16T00:40:00Z }
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
| Starters | webmvc, security, security-oauth2-resource-server, actuator, flyway, devtools, mybatis-spring-boot-starter 4.1.0 (spring-boot-starter-jdbc 포함)[^pom] |
| DB driver | PostgreSQL (runtime), `flyway-database-postgresql` (runtime) |
| Test | spring-boot-testcontainers, testcontainers-junit-jupiter, testcontainers-postgresql[^pom] |
| Config | `application.yaml`(기본값 없는 환경변수) + `application-local.yaml`(로컬 기본값)[^app-yaml] |
| Git | 루트 `hoka/` 저장소에 포함 (자체 `.git` 없음) |

# Commands

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local   # 프로파일 없이 실행하면 환경변수가 없어 기동 실패
./mvnw test                                               # Testcontainers: Docker가 떠 있어야 한다
./mvnw test -Dtest=MigrationTests
./mvnw package
```

# Notes

- 설정은 프로파일로 나뉜다. `application.yaml`은 `${DB_URL}`, `${BO_JWT_SECRET}`, `${BO_ADMIN_EMAIL}`, `${BO_ADMIN_PASSWORD}`, `${BO_FRONT_BASE_URL}`처럼 **기본값 없는** 환경변수만 두고, 로컬 값은 `application-local.yaml`에 있다(`appdb`/`app`, 로컬 시크릿, `admin@hoka.co.kr`). 운영은 환경변수로 채운다. 나중에 `dev`·`stg`·`prod`를 추가할 계획이다.[^app-yaml]
- 스키마는 Flyway가 관리한다. 마이그레이션은 `src/main/resources/db/migration`, 이력 테이블은 `appdb`를 FO·배치와 공유하므로 `bo_flyway_schema_history`로 분리했다. `V1`이 `bo_role`·`bo_menu`·`bo_role_menu`·`bo_user`·`bo_refresh_token`·`bo_login_history`를, `V2`가 역할 7개와 메뉴 트리(그룹 6 + 메뉴 18), 역할별 권한을 넣는다. 설계 근거는 저장소의 `docs/bo-auth-design.md`.
- 테스트는 Testcontainers로 빈 PostgreSQL을 띄우고 Flyway를 적용한다(`support/DatabaseTest`). 컨테이너는 `@TestConfiguration` 빈이라 컨텍스트를 공유하는 테스트끼리 하나를 같이 쓴다. 로컬 `appdb`는 건드리지 않는다.
- 에러 응답은 RFC 9457 ProblemDetail을 쓴다(`spring.mvc.problemdetails.enabled: true`).
- MyBatis: 매퍼 XML은 `classpath:mapper/**/*.xml`, `map-underscore-to-camel-case: true`. `@Mapper` 인터페이스는 애플리케이션 패키지 아래에서 자동 스캔한다(`@MapperScan` 없음).
- `config/SecurityConfig`: 모든 요청에 HTTP Basic 인증(Spring 기본 생성 사용자 `user`)을 요구하고, 세션을 만들지 않으며 CSRF는 끈다.[^security]
- 샘플 CRUD(`sample` 패키지, `mapper/SampleMapper.xml`, `SampleControllerTests`)는 삭제했다. 백오피스 인증·권한 기능을 시작하며 정리한 것으로, 남은 테스트는 `HokaBoApiApplicationTests` 하나다. FO에는 그대로 있다([Sample CRUD](/architecture/sample-crud.md)).
- 매퍼 XML이 없어 기동·테스트 때 `No MyBatis mapper was found` 경고가 난다. 첫 매퍼를 추가하면 사라진다.
- `server.port` 미설정 → 기본 8080. [hoka-fo-api](/projects/hoka-fo-api.md)와 동시 실행 시 포트 분리 필요.
- 소비자로 [hoka-bo-front](/projects/hoka-bo-front.md)를 가정한다. [System overview](/architecture/system-overview.md) 참고.

[^pom]: pom.xml
[^app-yaml]: application.yaml
[^security]: SecurityConfig.java
