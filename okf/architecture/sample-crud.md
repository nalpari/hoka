---
type: Architecture
title: Sample CRUD
description: sample 테이블과 hoka-fo-api·hoka-bo-api가 똑같이 제공하는 /api/samples CRUD 샘플 코드.
tags: [api, fo, bo, mybatis, sample]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-15T01:23:47Z }
sources:
  - id: fo-controller
    resource: ../../hoka-fo-api/src/main/java/com/hoka/fo/sample/SampleController.java
    title: SampleController.java (FO)
  - id: fo-mapper
    resource: ../../hoka-fo-api/src/main/resources/mapper/SampleMapper.xml
    title: SampleMapper.xml (FO)
  - id: bo-controller
    resource: ../../hoka-bo-api/src/main/java/com/hoka/bo/sample/SampleController.java
    title: SampleController.java (BO)
  - id: security
    resource: ../../hoka-fo-api/src/main/java/com/hoka/fo/config/SecurityConfig.java
    title: SecurityConfig.java (FO)
---

# Table

`appdb`의 `public.sample`. 코드가 만든 테이블이 아니라 DB에 이미 있던 테이블이며, 스키마 관리 도구는 아직 없다.

| 컬럼 | 타입 | 제약 |
|---|---|---|
| `id` | bigint | PK, `sample_id_seq` 기본값 |
| `name` | text | NOT NULL |
| `created_at` | timestamptz | NOT NULL, 기본값 `now()` |

# Endpoints

[hoka-fo-api](/projects/hoka-fo-api.md)와 [hoka-bo-api](/projects/hoka-bo-api.md)가 패키지명만 다르고 같은 계약을 제공한다.[^fo-controller][^bo-controller] 기본 설정에서는 둘 다 같은 `appdb`를 보므로 한쪽에서 바꾼 데이터가 다른 쪽에도 보인다.

| 메서드 | 경로 | 요청 본문 | 응답 |
|---|---|---|---|
| GET | `/api/samples` | - | 200, `id` 순 배열 |
| GET | `/api/samples/{id}` | - | 200 / 404 |
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

[^fo-controller]: SampleController.java (FO)
[^bo-controller]: SampleController.java (BO)
[^fo-mapper]: SampleMapper.xml (FO)
[^security]: SecurityConfig.java (FO)
