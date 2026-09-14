---
type: Project
title: hoka-bo-api
description: 백오피스 Spring Boot 4 API 서버 (패키지 com.hoka.bo).
resource: ../../hoka-bo-api/
tags: [backend, bo, spring-boot, java]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-14 }
sources:
  - id: pom
    resource: ../../hoka-bo-api/pom.xml
    title: pom.xml
  - id: app-yaml
    resource: ../../hoka-bo-api/src/main/resources/application.yaml
    title: application.yaml
---

# Stack

| 항목 | 값 |
|---|---|
| Framework | Spring Boot 4.1.1, Java 21, Maven Wrapper[^pom] |
| Starters | webmvc, security, actuator, devtools |
| DB driver | PostgreSQL (runtime) — JPA/JDBC starter 없음, datasource 미설정 |
| Config | `application.yaml` — `spring.application.name`만 설정[^app-yaml] |
| Git | 루트 `hoka/` 저장소에 포함 (자체 `.git` 없음) |

# Commands

```bash
./mvnw spring-boot:run
./mvnw test
./mvnw test -Dtest=HokaBoApiApplicationTests#contextLoads
./mvnw package
```

# Notes

- Spring Security 커스텀 설정이 없어 모든 엔드포인트가 기본 생성 사용자 인증을 요구한다.
- `server.port` 미설정 → 기본 8080. [hoka-fo-api](/projects/hoka-fo-api.md)와 동시 실행 시 포트 분리 필요.
- 소비자로 [hoka-bo-front](/projects/hoka-bo-front.md)를 가정한다. [System overview](/architecture/system-overview.md) 참고.

[^pom]: pom.xml
[^app-yaml]: application.yaml
