# Directory Update Log

## 2026-09-16
* **Update**: 프로필 사진 기능(hoka-bo-api의 `/api/users/{id}/avatar`, `V4` 마이그레이션, hoka-bo-front의 공용 `Avatar`와 `/avatar/[id]` 중계)에 맞춰 [BO 인증·권한](/architecture/bo-auth.md)의 모델·엔드포인트·프론트 연동 절, [hoka-bo-api](/projects/hoka-bo-api.md)·[hoka-bo-front](/projects/hoka-bo-front.md)의 Notes, [CLAUDE.md](../CLAUDE.md) 갱신. 아바타 사진이 "아직 없는 것" 목록에서 빠졌다.
* **Update**: 메뉴 관리 기능(hoka-bo-api의 `/api/menus` CRUD·순서 변경, `V3` 마이그레이션, hoka-bo-front의 `/menus` 화면)과 레일의 DB 구동 전환에 맞춰 [BO 인증·권한](/architecture/bo-auth.md)의 모델·엔드포인트·프론트 연동 절, [hoka-bo-api](/projects/hoka-bo-api.md)·[hoka-bo-front](/projects/hoka-bo-front.md)의 Notes, [CLAUDE.md](../CLAUDE.md)의 구현 화면 목록 갱신.
* **Update**: 사용자 목록에서 근거 없는 2단계 인증 열과 아바타 사진을 빼 행 전체를 실제 값으로 맞추고 [hoka-bo-front](/projects/hoka-bo-front.md)의 Notes 갱신.
* **Update**: hoka-bo-front에 권한 관리(`/roles`)와 사용자 관리(`/users`) 화면이 생겨 [hoka-bo-front](/projects/hoka-bo-front.md)의 Notes와 [BO 인증·권한](/architecture/bo-auth.md)의 프론트 연동 절, [CLAUDE.md](../CLAUDE.md)의 구현 화면 목록 갱신.
* **Update**: 워크트리를 만든 뒤 진입하지 않도록 [Worktrees](/development/worktrees.md)의 생성·정리 절과 [CLAUDE.md](../CLAUDE.md)의 Worktrees 규칙 갱신.
* **Update**: PR #2 적대적 리뷰에서 나온 인증 결함 3건(로그인 실패 기록 롤백, refresh 토큰 동시 재사용, 거절된 세션의 리다이렉트 루프) 수정에 맞춰 [BO 인증·권한](/architecture/bo-auth.md)의 토큰·로그인 규칙과 프론트 연동 절, [hoka-bo-front](/projects/hoka-bo-front.md)의 proxy 설명 갱신.
* **Update**: hoka-bo-front에 대시보드 화면과 공용 셸(레일·톱바)이 생겨 [hoka-bo-front](/projects/hoka-bo-front.md)의 Notes 갱신. 로그인 성공 시 착지가 `/dashboard`로 바뀌었다.
* **Update**: hoka-bo-front 디자인 시안에 기획전·콘텐츠 목록과 기획전 전시 구성 화면이 추가돼 [hoka-bo-front](/projects/hoka-bo-front.md)의 Notes 갱신.
* **Update**: hoka-bo-front에 로그인 화면과 BFF 인증 배관이 생겨 [hoka-bo-front](/projects/hoka-bo-front.md)의 Stack·Commands·Notes, [hoka-fo-front](/projects/hoka-fo-front.md)의 쌍둥이 문장, [BO 인증·권한](/architecture/bo-auth.md)의 프론트 연동 절, [System overview](/architecture/system-overview.md)의 BFF 절과 가정, [Worktrees](/development/worktrees.md)의 `.env` 복사 행 갱신.
* **Update**: hoka-bo-api에 springdoc(Swagger UI) 추가에 맞춰 [hoka-bo-api](/projects/hoka-bo-api.md)의 Stack·Notes와 [BO 인증·권한](/architecture/bo-auth.md)의 공개 경로 갱신.
* **Creation**: [BO 인증·권한](/architecture/bo-auth.md) 추가. [Architecture](/architecture/index.md) 갱신. 인증 방식이 정해져 [System overview](/architecture/system-overview.md)의 가정도 수정.
* **Update**: SecurityConfig가 HTTP Basic에서 JWT Resource Server로 바뀌고 Flyway baseline 설정이 추가돼 [hoka-bo-api](/projects/hoka-bo-api.md)의 Notes 갱신.
* **Update**: hoka-bo-api에 Flyway·OAuth2 Resource Server·Testcontainers 도입과 `local` 프로파일 분리에 맞춰 [hoka-bo-api](/projects/hoka-bo-api.md)의 Stack·Commands·Notes 갱신. [System overview](/architecture/system-overview.md)에 `# Schema ownership` 추가하고 DB 기본값 가정 수정.
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
