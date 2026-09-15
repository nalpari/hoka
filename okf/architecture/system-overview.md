---
type: Architecture
title: System overview
description: 프론트오피스/백오피스 각각 Next.js 프론트와 Spring Boot API 한 쌍, 그리고 셸에서 실행하는 배치 jar로 구성된 시스템.
tags: [architecture, fo, bo, batch]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-15T01:22:11Z }
---

# Components

| 영역 | Frontend | API |
|---|---|---|
| 프론트오피스 (고객용) | [hoka-fo-front](/projects/hoka-fo-front.md) | [hoka-fo-api](/projects/hoka-fo-api.md) |
| 백오피스 (관리자용) | [hoka-bo-front](/projects/hoka-bo-front.md) | [hoka-bo-api](/projects/hoka-bo-api.md) |

[hoka-batch](/projects/hoka-batch.md)는 FO/BO 어느 쪽에도 속하지 않는다. cron이 `java -jar`로 실행하며, 다른 프로젝트를 호출하지 않고 DB만 읽고 쓴다. Spring Batch 메타 테이블(`BATCH_*`)은 `appdb`의 `public` 스키마에 둔다.

# Assumptions (미검증)

- 각 프론트는 같은 영역의 API를 호출한다고 가정한다. 이는 프로젝트 이름에서 추론한 것이며 연동 코드는 아직 없다.
- 두 API와 배치는 MyBatis로 PostgreSQL에 접속하도록 설정돼 있다. 기본 접속 대상은 모두 `localhost:5432/appdb`(계정 `app`)이며, 운영 DB 구성은 미정.
- 배치 배포 위치(cron을 돌릴 리눅스 서버)와 운영 경로는 미정.
- 공유 DB 여부, 인증 방식, 배포 구성은 미정.

# Local ports (현재 기본값)

| 프로젝트 | 포트 |
|---|---|
| hoka-fo-front, hoka-bo-front | 3000 (충돌) |
| hoka-fo-api, hoka-bo-api | 8080 (충돌) |
| hoka-batch | 없음 (웹 서버 없음) |
