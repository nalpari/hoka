---
type: Architecture
title: Sample CRUD
description: sample 테이블과 hoka-fo-api가 제공하는 /api/samples CRUD 샘플 코드. 단건 조회에 Resilience4j 적용.
tags: [api, fo, mybatis, sample]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-17T00:23:21Z }
sources:
  - id: fo-controller
    resource: ../../hoka-fo-api/src/main/java/com/hoka/fo/sample/SampleController.java
    title: SampleController.java (FO)
  - id: fo-mapper
    resource: ../../hoka-fo-api/src/main/resources/mapper/SampleMapper.xml
    title: SampleMapper.xml (FO)
  - id: security
    resource: ../../hoka-fo-api/src/main/java/com/hoka/fo/config/SecurityConfig.java
    title: SecurityConfig.java (FO)
---

# Table

`appdb`의 `public.sample`. 코드가 만든 테이블이 아니라 DB에 이미 있던 테이블이며, 스키마 관리 도구는 아직 없다.
새 로컬 DB에는 직접 만들어야 한다. DDL은 루트 README "처음 설치하기" 5단계와 `hoka-batch/src/test/resources/schema.sql`에 있다.

| 컬럼 | 타입 | 제약 |
|---|---|---|
| `id` | bigint | PK, `sample_id_seq` 기본값 |
| `name` | text | NOT NULL |
| `created_at` | timestamptz | NOT NULL, 기본값 `now()` |

# Endpoints

[hoka-fo-api](/projects/hoka-fo-api.md)만 제공한다. [hoka-bo-api](/projects/hoka-bo-api.md)에도 같은 코드가 있었으나 백오피스 인증·권한 기능을 만들며 삭제했다. `sample` 테이블의 DDL이 저장소에 없어 새 로컬 DB에서 BO 테스트가 실패했기 때문이다.[^fo-controller]

| 메서드 | 경로 | 요청 본문 | 응답 |
|---|---|---|---|
| GET | `/api/samples` | - | 200, `id` 순 배열 |
| GET | `/api/samples/{id}` | - | 200 / 404 / 503(재시도 소진·브레이커 OPEN) |
| POST | `/api/samples` | `{"name": "..."}` | 201, 생성된 행 / 400(`name` 누락·공백) |
| PUT | `/api/samples/{id}` | `{"name": "..."}` | 200, 수정된 행 / 404 / 400 |
| DELETE | `/api/samples/{id}` | - | 204 / 404 |

응답 행은 `{"id": 1, "name": "...", "createdAt": "2026-09-15T01:23:19.837567Z"}` 형태다.

# Auth

모든 요청에 HTTP Basic 인증이 필요하다(Spring 기본 생성 사용자 `user`, 비밀번호는 기동 로그). 세션을 만들지 않고 CSRF는 꺼져 있어 토큰 없이 POST/PUT/DELETE를 보낼 수 있다.[^security]

# Implementation

- `Sample` record → `@Mapper SampleMapper` → `mapper/SampleMapper.xml`. 서비스 계층은 두지 않았다.
- INSERT/UPDATE는 PostgreSQL `returning`으로 결과 행을 한 번에 받기 위해 XML에서 `<select flushCache="true">`로 선언한다.[^fo-mapper]
- record는 컬럼 순서(`id, name, created_at`)대로 생성자에 매핑된다. 조회 컬럼 순서를 바꾸면 매핑이 깨진다.
- `SampleControllerTests`는 로컬 `appdb`에 실제로 접속해 행 하나를 만들고 지운다.
- 단건 조회에는 `@Retry`·`@CircuitBreaker`(인스턴스 `sample`)가 붙어 있다. 규칙과 설정 값은 [Resilience4j](/conventions/resilience4j.md).[^fo-controller]

[^fo-controller]: SampleController.java (FO)
[^fo-mapper]: SampleMapper.xml (FO)
[^security]: SecurityConfig.java (FO)
