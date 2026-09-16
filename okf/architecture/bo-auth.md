---
type: Architecture
title: BO 인증·권한
description: hoka-bo-api의 로그인(JWT), 역할×메뉴 CRUD 권한, 사용자 관리 API 계약과 운영 절차.
tags: [api, bo, auth, security, jwt]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-16T07:30:00Z }
sources:
  - id: security-config
    resource: ../../hoka-bo-api/src/main/java/com/hoka/bo/config/SecurityConfig.java
    title: SecurityConfig.java (BO)
  - id: converter
    resource: ../../hoka-bo-api/src/main/java/com/hoka/bo/config/BoJwtAuthenticationConverter.java
    title: BoJwtAuthenticationConverter.java
  - id: auth-service
    resource: ../../hoka-bo-api/src/main/java/com/hoka/bo/auth/AuthService.java
    title: AuthService.java
  - id: schema
    resource: ../../hoka-bo-api/src/main/resources/db/migration/V1__bo_auth_schema.sql
    title: V1__bo_auth_schema.sql
  - id: seed
    resource: ../../hoka-bo-api/src/main/resources/db/migration/V2__bo_role_menu_seed.sql
    title: V2__bo_role_menu_seed.sql
  - id: menu-service
    resource: ../../hoka-bo-api/src/main/java/com/hoka/bo/menu/MenuService.java
    title: MenuService.java
  - id: design
    resource: ../../docs/bo-api/bo-auth-design.md
    title: 백오피스 사용자·권한 관리 설계
---

# Model

백오피스 계정은 `bo_user`다. 스토어 회원과 다른 테이블이며 `bo_` 접두사로 나뉜다.[^schema]

- 사용자 1명은 역할 1개(`bo_user.role_code`)를 가진다.
- 권한은 역할 × 메뉴 × CRUD다(`bo_role_menu`). 메뉴가 실제로 쓰는 동작은 `bo_menu.use_*`로 정하고, 격자에서 `-`로 비는 칸이 그것이다.
- 슈퍼관리자 역할(`bo_role.is_super`, 하나만 존재)은 권한 행 없이 항상 전부 허용이다. 역할 수정·삭제·권한 저장 대상이 아니다.
- `bo_menu.exclusive_role_code`가 있으면 그 역할(과 슈퍼관리자)만 해당 메뉴 권한을 받는다. 시드에서는 등급·혜택·메뉴 관리·감사 로그가 슈퍼관리자, 세금계산서가 정산 담당 전용이다.[^seed]
- 사용자·권한 관리 메뉴(`SYS_USERS`, `SYS_ROLES`)는 조회 권한만 줄 수 있다. 쓰기는 모두 슈퍼관리자 전용이다.
- `bo_menu.icon`·`description`은 메뉴 관리 화면이 편집하는 표시 정보다(`V3`). `icon`은 레일이 그릴 아이콘 이름이고 그룹에는 없다. 레일은 이 값을 그대로 쓰므로 메뉴 관리에서 바꾸면 다음 화면 이동 때 반영된다.
- 트리 순서는 그룹의 `sort_order`가 바깥, 메뉴의 `sort_order`가 그 그룹 안이다. `GET /api/menus`가 그 순서로 내려준다.
- 프로필 사진은 `bo_user.avatar`(bytea)와 `avatar_updated_at`이다(`V4`). 외부 스토리지가 없어 DB에 둔다. 서버가 올라온 파일을 128x128 PNG로 정규화해 저장하므로 한 행은 수십 KB이고, 20·26·44px 어디에 그리든 이 한 장을 쓴다. 두 컬럼은 항상 같이 차거나 같이 비고(`bo_user_avatar_pair`), `avatar_updated_at`이 null이면 화면이 이름 이니셜로 그린다.

# Tokens

- access 토큰은 HS256 JWT, 15분, 클레임은 `sub`(= `bo_user.id`)뿐이다.[^auth-service]
- 권한은 토큰에 넣지 않는다. 요청마다 DB에서 읽어 authority(`SUPER` 또는 `MENU_CODE:C|R|U|D`)로 만든다. 잠금·비활성화·역할 변경·권한 저장이 즉시 반영된다.[^converter]
- 임시 비밀번호를 쓰는 동안(`password_change_required`)에는 authority가 `PASSWORD_CHANGE_REQUIRED` 하나뿐이라 비밀번호 변경 외에는 막힌다.
- refresh 토큰은 랜덤 문자열이고 서버에는 SHA-256 해시만 남는다. 쓸 때마다 새로 발급하며 이미 쓴 토큰은 거부한다. 만료는 로그인 유지 30일 / 미유지 12시간이고, 회전해도 원래 만료 시각을 유지한다.
- 토큰 소비는 `delete ... returning` 한 문장이다. 조회와 삭제를 나누면 같은 토큰으로 동시에 들어온 두 요청이 모두 통과해 세션이 둘로 갈라진다. 행을 지운 쪽만 결과를 받으므로 하나만 이긴다.
- 로그인 실패 경로는 `noRollbackFor = ApiException.class`로 커밋한다. 실패 횟수·잠금·이력을 쓴 뒤 예외를 던지므로, 기본 롤백 규칙을 두면 5회 잠금과 감사 기록이 전혀 쌓이지 않는다.
- 잠금 해제·비밀번호 초기화·비활성화는 그 사용자의 refresh 토큰을 지운다.

# Login rules

| 상황 | 결과 |
|---|---|
| 비밀번호 틀림 | 401 `INVALID_CREDENTIALS`, 실패 횟수 +1 |
| 5회째 실패 | 계정 잠금(`PASSWORD_FAILED`), 이력 `LOCKED`, 401 `ACCOUNT_LOCKED` |
| 없는 이메일·초대 대기·비활성 | 401 `INVALID_CREDENTIALS` (계정 존재 여부를 숨긴다) |
| 마지막 접속 90일 초과 | 잠금(`DORMANT`) 후 401 `ACCOUNT_LOCKED`. 배치 없이 로그인 시점에만 판단한다 |
| 성공 | 실패 횟수 0, `last_login_at` 갱신, 이력 `SUCCESS`, 토큰 발급 |

로그인 이력(`bo_login_history`)은 없는 이메일로 한 시도도 남긴다(`user_id` null). 지역 정보는 남기지 않고 `user_agent` 원문만 저장한다.

# Endpoints

공개는 인증 없이 부를 수 있다. 그 외는 `Authorization: Bearer <access>`가 필요하다.[^security-config]

| 메서드 | 경로 | 권한 |
|---|---|---|
| POST | `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` | 공개 |
| GET | `/swagger-ui.html`, `/v3/api-docs/**` | 공개. 단 springdoc이 켜진 환경(`local`)에만 존재한다 |
| GET | `/api/invitations/{token}` · POST `/api/invitations/{token}/accept` | 공개 |
| GET | `/api/auth/me` · PUT `/api/auth/password` | 로그인 |
| GET | `/api/roles`, `/api/roles/{code}` | `SYS_ROLES:R` |
| POST·PUT·DELETE | `/api/roles`, `/api/roles/{code}`, `/api/roles/{code}/permissions` | `SUPER` |
| GET | `/api/menus` | `SYS_ROLES:R` 또는 `SYS_MENUS:R` (권한 격자와 메뉴 관리가 같이 쓴다) |
| POST·PUT·DELETE | `/api/menus`, `/api/menus/{code}`, `/api/menus/{code}/move` | `SUPER` |
| GET | `/api/users`, `/api/users/departments`, `/api/users/{id}`, `/api/users/{id}/login-history` | `SYS_USERS:R` |
| POST·PATCH | `/api/users`, `/api/users/{id}`, `/api/users/{id}/invitation`, `/api/users/{id}/unlock`, `/api/users/{id}/password-reset`, `/api/users/deactivate`, `/api/users/role` | `SUPER` |
| GET | `/api/users/{id}/avatar` | 로그인. 목록·역할 구성원·레일이 남의 사진도 그린다 |
| POST·DELETE | `/api/users/{id}/avatar` | `SUPER` 또는 본인(`sub`가 그 `id`) |

메일 발송이 없어 **초대 링크와 임시 비밀번호는 응답 본문으로 돌려준다**. 화면에서 한 번만 보여 주고 전달은 사람이 한다.

`PUT /api/menus/{code}/move`는 `{"direction":"up"|"down"}`을 받아 같은 그룹 안 이웃과 순서를 맞바꾼다. 끝이면 아무것도 하지 않는다. 그룹을 옮기는 일은 `PUT /api/menus/{code}`가 `parentCode`로 하고, 옮겨 간 그룹의 맨 뒤에 붙는다.

`POST /api/users/{id}/avatar`는 `file` 하나짜리 multipart다. 파일은 10MB까지 받고(`spring.servlet.multipart`), 서버가 가운데를 정사각으로 잘라 128x128 PNG로 다시 쓴다. 메모리를 좌우하는 건 파일 크기가 아니라 픽셀 수라, 디코드하기 전에 헤더의 치수를 읽어 5천만 픽셀을 넘으면 거절한다(`AVATAR_TOO_LARGE`). ImageIO가 읽지 못하면 `AVATAR_NOT_IMAGE`로 거절하므로 확장자를 속인 파일도 걸린다. EXIF 방향은 보지 않는다.

메뉴 쓰기 규칙:[^menu-service]

- 그룹(`parentCode` 없음)은 경로·아이콘·`use_*`·전용 역할을 갖지 않는다. 보내도 서버가 비운다.
- 그룹과 메뉴는 서로 바꿀 수 없다(`MENU_KIND_IMMUTABLE`). 새로 만들고 옮긴다.
- 하위 메뉴가 있는 그룹(`MENU_HAS_CHILDREN`)과 역할이 권한을 가진 메뉴(`MENU_IN_USE`)는 지우지 못한다. 권한이 조용히 사라지지 않게 권한 관리에서 먼저 빼게 한다.
- `SYS_MENUS`는 삭제도 숨김도 막는다(`MENU_SELF_DELETE`, `MENU_SELF_HIDDEN`). 메뉴 관리 화면으로 돌아올 길이 사라지기 때문이다.
- 경로는 `/`로 시작하는 소문자·숫자·하이픈이고 전체에서 유일해야 한다(`MENU_PATH_DUPLICATE`).

에러는 RFC 9457 ProblemDetail에 `code`를 실어 구분한다. 예: `ROLE_IN_USE`, `ROLE_EXCLUSIVE_MENU`, `SUPER_ROLE_IMMUTABLE`, `MENU_IS_GROUP`, `ACTION_NOT_SUPPORTED`, `MENU_EXCLUSIVE`, `READ_REQUIRED`, `MENU_CODE_DUPLICATE`, `MENU_PATH_DUPLICATE`, `MENU_HAS_CHILDREN`, `MENU_IN_USE`, `MENU_KIND_IMMUTABLE`, `MENU_PARENT_INVALID`, `MENU_SELF_DELETE`, `MENU_SELF_HIDDEN`, `USE_READ_REQUIRED`, `AVATAR_NOT_IMAGE`, `AVATAR_TOO_LARGE`, `AVATAR_UNREADABLE`, `AVATAR_NOT_FOUND`, `EMAIL_DUPLICATE`, `LAST_SUPER_ADMIN`, `SELF_DEACTIVATION`, `NOT_LOCKED`, `INVITE_INVALID`, `REFRESH_INVALID`, `ACCOUNT_LOCKED`.

# Operations

**첫 슈퍼관리자.** 사용자는 초대로만 생기고 초대는 슈퍼관리자만 할 수 있다. 슈퍼관리자 역할 사용자가 0명이면 기동할 때 `BO_ADMIN_EMAIL`·`BO_ADMIN_PASSWORD`로 한 명을 만들고 `password_change_required`를 켠다. 이미 있으면 아무것도 하지 않는다. 테스트(`test` 프로파일)에서는 돌지 않는다.

**슈퍼관리자가 모두 잠긴 경우.** 잠금 해제도 슈퍼관리자만 할 수 있어 API로는 풀 수 없다. DB에서 직접 푼다.

```sql
update bo_user
set status = 'ACTIVE', lock_reason = null, locked_at = null,
    failed_login_count = 0, last_login_at = now()
where email = '<슈퍼관리자 이메일>';
```

자기 계정 비활성화·자기 역할 변경, 마지막 활성 슈퍼관리자의 강등·비활성화는 API가 409로 막아 이 상황을 애초에 줄인다.

**Flyway baseline.** `appdb`의 `public`에는 다른 프로젝트의 테이블이 이미 있다. 그래서 `baseline-on-migrate: true`와 함께 **`baseline-version: 0`**을 쓴다. 기본 baseline 버전(1)을 그대로 두면 `V1`이 적용된 것으로 기록돼 `bo_*` 테이블이 만들어지지 않는다.

# Front integration

[hoka-bo-front](/projects/hoka-bo-front.md)가 BFF로 붙어 있다. 로그인 화면(`/login`)은 Server Action으로 `POST /api/auth/login`을 부르고 토큰을 HttpOnly 쿠키 `bo_at`(15분)·`bo_rt`(30일/12시간)에 담는다. "로그인 유지" 선택은 `bo_rm`에 남긴다 — refresh를 회전시킬 때 원래 선택을 알아야 만료가 줄지 않는다.

`src/proxy.ts`가 보호 라우트를 지키고, access 쿠키가 사라지면 `POST /api/auth/refresh`로 갱신해 응답과 요청 헤더 양쪽에 새 쿠키를 싣는다. 로그인 이력의 IP·UA는 BFF가 넘긴 `X-Forwarded-For`·`User-Agent`에서 온다.

API가 세션을 거절하면(계정 비활성화, 권한 회수 등) 페이지는 `/login`이 아니라 **`/session/clear`**로 보낸다. 이 Route Handler가 쿠키를 지운 뒤 `/login?expired=1`로 넘긴다. 곧장 `/login`으로 보내면 proxy가 아직 남아 있는 access 쿠키를 보고 다시 대시보드로 돌려보내 무한 왕복이 된다. 그래서 `/session/clear`는 쿠키가 있어도 통과시키는 유일한 경로다.

역할·사용자 API는 `/roles`·`/users` 화면이 쓴다(경로는 `bo_menu.path` 시드와 같다). 조회는 `SYS_ROLES:R`·`SYS_USERS:R`, 변경은 `SUPER`라서 화면은 `me.isSuper` 하나로 읽기/쓰기를 가른다. 슈퍼관리자 역할은 `bo_role_menu`에 행이 없고 암묵적으로 모든 메뉴를 쓰므로, 격자와 "접근 가능한 메뉴"는 그 역할을 따로 처리한다(권한 0건이 아니라 전부 허용으로 그린다).

메뉴 API는 `/menus` 화면이 쓴다. 조회는 `SYS_MENUS:R`, 변경은 `SUPER`다. 레일(`components/Rail.tsx`)은 하드코딩된 목록이 아니라 `GET /api/auth/me`의 `menus`를 그리므로, 이 화면에서 이름·아이콘·순서·노출을 바꾸면 레일이 따라간다. `MenuAccess`가 `groupName`과 `icon`을 같이 내려 주는 이유다.

사진은 브라우저가 API에서 바로 받지 못한다(토큰이 HttpOnly 쿠키에 있다). `<img>`가 부르는 주소는 Next의 `/avatar/{id}` Route Handler이고, 그것이 Bearer를 붙여 API로 중계한다. 화면은 `?v=<avatarUpdatedAt>`을 붙여 부르므로 사진이 바뀌면 주소가 바뀌고, 그래서 응답을 하루 캐시해도 오래된 사진이 남지 않는다.

초대 링크·임시 비밀번호는 응답 본문에만 있고 다시 조회할 수 없다. 화면은 이 값을 상세 패널에 한 번 띄우고, 사용자가 놓치면 다시 초대(`POST /api/users/{id}/invitation`)하거나 다시 초기화(`POST /api/users/{id}/password-reset`)하게 한다.

# Not built yet

설계에서 뒤로 미룬 것들이다. 상세는 [설계 문서](../../docs/bo-api/bo-auth-design.md).[^design]

- OTP(2단계 인증), 메일 발송
- 메뉴 트리 버전(초안/배포)과 변경 이력. 메뉴 편집은 저장하는 즉시 반영된다
- 권한 위임(부여 근거·한도·만료), 데이터 범위(담당 카테고리), 멀티 스토어
- 감사 로그·변경 이력, 역할 복제, CSV 내보내기

[^security-config]: SecurityConfig.java (BO)
[^converter]: BoJwtAuthenticationConverter.java
[^auth-service]: AuthService.java
[^schema]: V1__bo_auth_schema.sql
[^seed]: V2__bo_role_menu_seed.sql
[^menu-service]: MenuService.java
[^design]: 백오피스 사용자·권한 관리 설계
