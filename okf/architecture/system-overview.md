---
type: Architecture
title: System overview
description: 프론트오피스/백오피스 각각 Next.js 프론트와 Spring Boot API 한 쌍, 그리고 셸에서 실행하는 배치 jar로 구성된 시스템.
tags: [architecture, fo, bo, batch]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-16T00:40:00Z }
---

# Components

| 영역 | Frontend | API |
|---|---|---|
| 프론트오피스 (고객용) | [hoka-fo-front](/projects/hoka-fo-front.md) | [hoka-fo-api](/projects/hoka-fo-api.md) |
| 백오피스 (관리자용) | [hoka-bo-front](/projects/hoka-bo-front.md) | [hoka-bo-api](/projects/hoka-bo-api.md) |

[hoka-batch](/projects/hoka-batch.md)는 FO/BO 어느 쪽에도 속하지 않는다. cron이 `java -jar`로 실행하며, 다른 프로젝트를 호출하지 않고 DB만 읽고 쓴다. Spring Batch 메타 테이블(`BATCH_*`)은 `appdb`의 `public` 스키마에 둔다.

# BO 프론트 ↔ BO API

브라우저는 [hoka-bo-api](/projects/hoka-bo-api.md)를 직접 부르지 않는다. [hoka-bo-front](/projects/hoka-bo-front.md)의 Next 서버(BFF)가 토큰을 HttpOnly 쿠키로 들고 있다가 API에 Bearer로 전달한다. 그래서 API에는 CORS 설정이 없고 CSRF도 꺼져 있다. 프론트는 `BO_API_BASE_URL`로 API 주소를 받는다. 자세한 계약은 [BO 인증·권한](/architecture/bo-auth.md).

# Schema ownership

`appdb`의 `public` 스키마를 세 프로젝트가 나눠 쓴다. 이름으로 주인을 가른다.

| 접두사 | 주인 | 관리 방법 |
|---|---|---|
| `bo_` | [hoka-bo-api](/projects/hoka-bo-api.md) | Flyway(`db/migration`), 이력 테이블 `bo_flyway_schema_history` |
| `BATCH_` | [hoka-batch](/projects/hoka-batch.md) | 로컬은 `initialize-schema: always`, 운영은 DDL 수동 적용 |
| `sample` | [hoka-fo-api](/projects/hoka-fo-api.md) | 관리 도구 없음. DDL이 저장소에 없다 |

# Assumptions (미검증)

- hoka-fo-front가 hoka-fo-api를 호출한다고 가정한다. 프로젝트 이름에서 추론한 것이며 FO에는 아직 연동 코드가 없다.
- 두 API와 배치는 MyBatis로 PostgreSQL에 접속하도록 설정돼 있다. 로컬 접속 대상은 모두 `localhost:5432/appdb`(계정 `app`)이며, 운영 DB 구성은 미정. hoka-bo-api만 기본값 없이 `local` 프로파일이나 환경변수로 받는다.
- 배치 배포 위치(cron을 돌릴 리눅스 서버)와 운영 경로는 미정.
- 공유 DB 여부와 배포 구성은 미정. FO 인증도 미정.

# Local ports (현재 기본값)

| 프로젝트 | 포트 |
|---|---|
| hoka-fo-front, hoka-bo-front | 3000 (충돌) |
| hoka-fo-api, hoka-bo-api | 8080 (충돌) |
| hoka-batch | 없음 (웹 서버 없음) |
