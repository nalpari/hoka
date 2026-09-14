---
type: Architecture
title: System overview
description: 프론트오피스/백오피스 각각 Next.js 프론트와 Spring Boot API 한 쌍으로 구성된 시스템.
tags: [architecture, fo, bo]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-14 }
---

# Components

| 영역 | Frontend | API |
|---|---|---|
| 프론트오피스 (고객용) | [hoka-fo-front](/projects/hoka-fo-front.md) | [hoka-fo-api](/projects/hoka-fo-api.md) |
| 백오피스 (관리자용) | [hoka-bo-front](/projects/hoka-bo-front.md) | [hoka-bo-api](/projects/hoka-bo-api.md) |

# Assumptions (미검증)

- 각 프론트는 같은 영역의 API를 호출한다고 가정한다. 이는 프로젝트 이름에서 추론한 것이며 연동 코드는 아직 없다.
- 두 API의 저장소로 PostgreSQL을 가정한다(드라이버만 존재).
- 공유 DB 여부, 인증 방식, 배포 구성은 미정.

# Local ports (현재 기본값)

| 프로젝트 | 포트 |
|---|---|
| hoka-fo-front, hoka-bo-front | 3000 (충돌) |
| hoka-fo-api, hoka-bo-api | 8080 (충돌) |
