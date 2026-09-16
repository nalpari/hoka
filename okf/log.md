# Directory Update Log

## 2026-09-16
* **Update**: hoka-bo-api의 샘플 CRUD 삭제에 맞춰 [Sample CRUD](/architecture/sample-crud.md)를 FO 전용으로, [hoka-bo-api](/projects/hoka-bo-api.md)의 Notes를 갱신. [Architecture](/architecture/index.md) 설명 갱신.

## 2026-09-15
* **Creation**: [Resilience4j](/conventions/resilience4j.md) 추가. [Conventions](/conventions/index.md) 갱신.
* **Update**: hoka-fo-api의 Resilience4j 도입에 맞춰 [hoka-fo-api](/projects/hoka-fo-api.md)의 Stack·Notes와 [Sample CRUD](/architecture/sample-crud.md)의 `GET /api/samples/{id}` 응답(FO 503) 갱신.
* **Creation**: [hoka-batch](/projects/hoka-batch.md) 추가. [Projects](/projects/index.md), [System overview](/architecture/system-overview.md), [OKF authoring](/conventions/okf-authoring.md)의 프로젝트 목록 갱신.
* **Creation**: [Sample CRUD](/architecture/sample-crud.md) 추가.
* **Update**: SecurityConfig(HTTP Basic, STATELESS, CSRF 끔)와 샘플 CRUD 추가에 맞춰 [hoka-fo-api](/projects/hoka-fo-api.md), [hoka-bo-api](/projects/hoka-bo-api.md)의 Notes 갱신.
* **Update**: DB 접속 기본값을 `appdb`/`app`으로 변경. [hoka-fo-api](/projects/hoka-fo-api.md), [hoka-bo-api](/projects/hoka-bo-api.md), [System overview](/architecture/system-overview.md) 갱신.
* **Update**: MyBatis 추가에 맞춰 [hoka-fo-api](/projects/hoka-fo-api.md), [hoka-bo-api](/projects/hoka-bo-api.md), [System overview](/architecture/system-overview.md)의 Stack·Notes 갱신.
* **Update**: 프론트 패키지 매니저 npm → pnpm 전환에 맞춰 [hoka-fo-front](/projects/hoka-fo-front.md), [hoka-bo-front](/projects/hoka-bo-front.md), [Worktrees](/development/worktrees.md)의 명령 갱신.

## 2026-09-14
* **Update**: [OKF authoring](/conventions/okf-authoring.md)에 기존 문서를 고칠 때의 frontmatter 규칙 추가.
* **Update**: `origin` 원격 연결에 맞춰 [Worktrees](/development/worktrees.md) 전제 갱신.
* **Update**: 루트 git 저장소 생성에 맞춰 [Projects](/projects/index.md)와 [Worktrees](/development/worktrees.md)의 Git 상태 갱신.
* **Creation**: [Worktrees](/development/worktrees.md) 절차 추가.
* **Initialization**: OKF v0.2 번들 생성. [Projects](/projects/index.md), [System overview](/architecture/system-overview.md), [OKF authoring](/conventions/okf-authoring.md) 추가.
