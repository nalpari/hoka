---
type: Project
title: hoka-bo-api
description: 백오피스 Spring Boot 4 API 서버 (패키지 com.hoka.bo).
resource: ../../hoka-bo-api/
tags: [backend, bo, spring-boot, java]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-16T07:30:00Z }
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
| Starters | webmvc, security, security-oauth2-resource-server, actuator, flyway, devtools, mybatis-spring-boot-starter 4.1.0 (spring-boot-starter-jdbc 포함), springdoc-openapi-starter-webmvc-ui 3.1.1[^pom] |
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
- 프로필 사진은 `user/AvatarService`가 맡는다. 올라온 파일을 JDK의 ImageIO로 128x128 PNG로 정규화해 DB에 넣으므로 이미지 라이브러리 의존성이 없다. 보기는 로그인한 사람 누구나, 바꾸기·지우기는 슈퍼관리자이거나 본인일 때만 된다.
- 메뉴 CRUD는 `menu` 패키지다(`/api/menus`). 조회는 `SYS_ROLES:R` 또는 `SYS_MENUS:R`(권한 격자와 메뉴 관리가 같은 목록을 쓴다), 생성·수정·삭제·순서 변경은 `SUPER`다. 그룹 삭제는 하위 메뉴가, 메뉴 삭제는 역할 권한이 남아 있으면 409로 막고, `SYS_MENUS` 자신은 삭제도 숨김도 막는다. 계약은 [BO 인증·권한](/architecture/bo-auth.md).
- 스키마는 Flyway가 관리한다. 마이그레이션은 `src/main/resources/db/migration`, 이력 테이블은 `appdb`를 FO·배치와 공유하므로 `bo_flyway_schema_history`로 분리했다. `public`에 다른 프로젝트의 테이블이 이미 있어 `baseline-on-migrate: true`와 `baseline-version: 0`을 쓴다(기본 baseline 버전 1이면 `V1`을 건너뛴다). `V1`이 `bo_role`·`bo_menu`·`bo_role_menu`·`bo_user`·`bo_refresh_token`·`bo_login_history`를, `V2`가 역할 7개와 메뉴 트리(그룹 6 + 메뉴 18), 역할별 권한을 넣는다. `V3`은 `bo_menu`에 `icon`·`description`을 더하고 기존 18개 메뉴의 아이콘을 채운다 — 그전까지 프론트 레일이 하드코딩하고 있던 값이다. `V4`는 `bo_user`에 프로필 사진(`avatar` bytea, `avatar_updated_at`)을 더한다. 설계 근거는 저장소의 `docs/bo-api/bo-auth-design.md`.
- 테스트는 Testcontainers로 빈 PostgreSQL을 띄우고 Flyway를 적용한다(`support/DatabaseTest`). 컨테이너는 `@TestConfiguration` 빈이라 컨텍스트를 공유하는 테스트끼리 하나를 같이 쓴다. 로컬 `appdb`는 건드리지 않는다.
- 에러 응답은 RFC 9457 ProblemDetail을 쓴다(`spring.mvc.problemdetails.enabled: true`).
- API 문서는 springdoc이다. `application.yaml`에서 `springdoc.api-docs.enabled`와 `springdoc.swagger-ui.enabled`를 **false로 두고 `local`에서만 켠다**. 내부 API 문서를 인증 없이 노출하지 않기 위해서다. 켜진 환경에서는 `/swagger-ui.html`과 `/v3/api-docs`가 SecurityConfig의 공개 경로이며, 꺼진 환경에서는 경로 자체가 없다. `config/OpenApiConfig`가 Bearer 스킴을 선언해 Swagger UI의 Authorize로 토큰을 넣을 수 있다.[^security]
- MyBatis: 매퍼 XML은 `classpath:mapper/**/*.xml`, `map-underscore-to-camel-case: true`. `@Mapper` 인터페이스는 애플리케이션 패키지 아래에서 자동 스캔한다(`@MapperScan` 없음).
- `config/SecurityConfig`: JWT Resource Server. 로그인·갱신·로그아웃·초대·`/actuator/health`만 공개이고 나머지는 Bearer 토큰이 필요하다. 세션을 만들지 않고 CSRF는 끈다. 인가 규칙은 컨트롤러가 아니라 Service 메서드의 `@PreAuthorize`에 있다(`@EnableMethodSecurity`). 계약과 규칙은 [BO 인증·권한](/architecture/bo-auth.md).[^security]
- 샘플 CRUD(`sample` 패키지, `mapper/SampleMapper.xml`, `SampleControllerTests`)는 삭제했다. 백오피스 인증·권한 기능을 시작하며 정리한 것으로, 남은 테스트는 `HokaBoApiApplicationTests` 하나다. FO에는 그대로 있다([Sample CRUD](/architecture/sample-crud.md)).
- 매퍼 XML이 없어 기동·테스트 때 `No MyBatis mapper was found` 경고가 난다. 첫 매퍼를 추가하면 사라진다.
- `server.port` 미설정 → 기본 8080. [hoka-fo-api](/projects/hoka-fo-api.md)와 동시 실행 시 포트 분리 필요.
- 소비자로 [hoka-bo-front](/projects/hoka-bo-front.md)를 가정한다. [System overview](/architecture/system-overview.md) 참고.

[^pom]: pom.xml
[^app-yaml]: application.yaml
[^security]: SecurityConfig.java
