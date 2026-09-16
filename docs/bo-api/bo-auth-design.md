# 백오피스 사용자·권한 관리 설계

> 상태: 스키마·API 설계 확정(2026-09-15), 구현 전
> 근거 디자인: `hoka-bo-front/ref/design/roles.html`, `users.html` (연관: `menus.html`, `login.html`)
> 구현 대상: `hoka-bo-api`

## 1. 범위

| 영역 | 이번 작업 |
|---|---|
| 사용자(`bo_user`), 역할(`bo_role`), 메뉴(`bo_menu`), 역할별 메뉴 권한(`bo_role_menu`) | 포함 |
| 로그인 이력(`bo_login_history`), 잠금(5회 실패·90일 미접속) | 포함 |
| 초대(토큰·만료) | 포함. 메일 발송은 제외(초대 API 응답으로 링크 반환) |
| 로그인 + Spring Security + JWT(access/refresh), API별 권한 검사 | 포함 |
| 메뉴 트리 버전(초안/배포), 권한 위임(근거·한도·만료) | 제외 |
| 데이터 범위(담당 카테고리), 멀티 스토어 | 제외 (스토어 1개 가정) |
| OTP(2단계 인증) | 제외. 필요 시 Flyway 마이그레이션으로 컬럼 추가 |
| 감사 로그·변경 이력, 역할 복제, 아바타 사진, CSV 내보내기 | 제외 |
| 메뉴 CRUD API(menus.html) | 제외. 메뉴는 시드, API는 조회만 |

기존 `sample`, `user` 테이블은 샘플 코드용이며 앞으로 사용하지 않는다. 새 테이블은 이들을 참조하지 않는다.

## 2. 결정 기록

| # | 주제 | 결정 | 이유 |
|---|---|---|---|
| Q1 | 범위 | 위 1장 | CRUD 격자·사용자 목록/상세·잠금 해제까지 동작하는 최소 범위 |
| Q2 | DDL 관리 | Flyway를 `hoka-bo-api`에 추가. history 테이블 `bo_flyway_schema_history` | 개발자별 로컬 DB라 스키마 동기화를 자동화해야 함 |
| Q3 | 테이블 위치·이름 | `public` 스키마, `bo_` 접두사 | 설정 추가 없음. FO 회원 테이블과 이름 충돌 방지. `user` 예약어 회피 |
| Q4 | PK | `bo_user.id`는 `bigint generated always as identity`. `bo_role`·`bo_menu`는 불변 `code` 자체가 PK | 디자인상 역할·메뉴 코드는 변경 불가. 조인 없이 권한 식별 |
| Q5 | 메뉴 그룹 | `bo_menu` 한 테이블 자기 참조. `parent_code` null = 그룹, 그룹은 `path` null | 테이블 1개. 2단계 제한과 "그룹엔 권한 없음"은 앱에서 검증 |
| Q6 | 격자의 `-` 칸 | `bo_menu.use_create/read/update/delete`. 메뉴가 쓰지 않는 동작에 권한 저장 시 API 400 | `-`는 메뉴 속성 |
| Q7 | 슈퍼관리자 | `bo_role.is_super`(부분 unique로 1개만). 권한 행 없이 전부 허용. 수정·삭제·권한 저장 거부. "초대·잠금 해제는 슈퍼관리자만"은 API에서 `is_super`로 검사 | 메뉴 추가 시 행 누락 위험 제거 |
| Q8 | "OO 전용" 메뉴 | `bo_menu.exclusive_role_code`(FK). 설정되면 그 역할(+슈퍼관리자)만 권한 부여 가능, 그 외 API 400 | 디자인상 전용 역할은 늘 1개 |
| Q9 | 사용자 상태·잠금 | `status`(INVITED/ACTIVE/LOCKED/INACTIVE) + `lock_reason`(PASSWORD_FAILED/DORMANT), `locked_at`, `failed_login_count`, `password_change_required`. 90일 미접속 잠금은 **로그인 시점에만** 판단(배치 없음, 목록에 즉시 반영하지 않음) | 목록 필터가 컬럼 하나로 끝남 |
| Q10 | 초대 | `bo_user` 컬럼: `password_hash` null 허용, `invite_token_hash`(SHA-256), `invite_expires_at`(24시간), `invited_by`. 재초대는 토큰 덮어쓰기. 수락 시 토큰 비우고 ACTIVE | 사용자당 유효 초대는 1개. 발송 이력 화면 없음 |
| Q11 | OTP | 이번엔 제외(컬럼 없음) | 등록 흐름 없이는 채울 수 없는 컬럼 |
| Q12 | 인증 | `bo_user` 기반 로그인·잠금·이력·API 권한 검사까지 포함. Spring Security + JWT | 로그인 없이는 잠금·이력·권한이 동작하지 않음 |
| Q13 | 토큰 | access JWT 15분(무상태, Spring Security OAuth2 Resource Server의 Nimbus). refresh는 랜덤 문자열 해시를 `bo_refresh_token`에 저장, 사용 시 rotation. 잠금·비활성화·비밀번호 초기화 시 해당 사용자 refresh 삭제. "로그인 유지" 30일 / 미유지 12시간 | 기기별 로그아웃·차단 가능 |
| Q14 | 권한 정보 | access 토큰에는 `sub`(user id)만. 요청마다 `bo_user` ⨝ `bo_role` ⨝ `bo_role_menu` 1회 조회, `status <> 'ACTIVE'`면 거부. 캐시 없음 | 잠금·비활성화·역할 변경·권한 저장이 모두 즉시 반영. 다중 인스턴스 안전 |
| Q15 | 메뉴 데이터 | Flyway 시드(그룹 6 + 메뉴 18) + 역할 7개와 역할별 권한 시드. 메뉴 API는 조회만 | 모든 로컬 DB에 동일 메뉴 |
| Q16 | 첫 슈퍼관리자 | 기동 시 슈퍼관리자 역할 사용자가 0명이면 `BO_ADMIN_EMAIL`/`BO_ADMIN_PASSWORD`로 생성, `password_change_required = true`. 로컬 기본값은 `application.yaml`(`admin@hoka.co.kr` / `admin1234!`) | 운영 DB에 알려진 비밀번호를 넣지 않음. datasource와 같은 env 기본값 방식 |
| Q17 | 부서 | `bo_user.department text`(자유 입력). 필터 후보는 `distinct`. 아바타는 이니셜 | 부서 관리 화면 없음 |
| Q18 | 로그인 이력 | 없는 이메일 시도도 기록(`user_id` null). `user_agent` 원문만 저장, 브라우저명은 프론트 파싱, 지역 제외. 목록의 최근 접속은 이력 마지막 행, `bo_user.last_login_at`은 성공 시만 갱신(90일 판단용). 연속 실패 묶음은 표시 단에서 | GeoIP 의존성 회피 |
| Q19 | 삭제 | 사용자 삭제 API 없음(비활성화만). 역할 삭제는 소속 사용자(비활성 포함)나 전용 메뉴가 있으면 409(FK `no action`), 슈퍼관리자 역할은 거부. `bo_role_menu`는 역할 삭제 시 cascade | 삭제로 여러 사람 권한이 조용히 바뀌는 것 방지 |
| Q20 | 감사 컬럼 | `bo_user`·`bo_role`·`bo_menu`에 `created_at`/`updated_at`, `bo_user.password_changed_at`. 작업자 컬럼 없음(감사 로그 때). `updated_at`은 MyBatis update 문에서 `now()`. 권한 저장 시 `bo_role.updated_at` 갱신 | 트리거 없이 SQL에서 보이게 |

추가로 확정한 규칙:

1. C·U·D 권한에는 R이 필요하다(`bo_role_menu` check).
2. 이메일 중복은 대소문자를 무시한다(`lower(email)` unique).
3. 라이브 방송(`OPS_LIVE`)은 `visible = false`로 시드해 18개를 맞춘다.
4. menus.html의 영어 이름·아이콘·새 창·설명 컬럼은 넣지 않는다. 프론트 레일에 `icon`이 필요해지면 마이그레이션으로 추가한다.
5. 역할의 소속 사용자 수, 부여 메뉴 수("13/18")는 조회 시 집계한다.

## 3. 스키마 — `V1__bo_auth_schema.sql`

```sql
create table bo_role (
    code        text primary key,                 -- OPS_ADMIN (불변)
    name        text not null unique,
    description text,
    is_super    boolean not null default false,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);
create unique index bo_role_single_super on bo_role (is_super) where is_super;

create table bo_menu (
    code                text primary key,         -- SYS_ROLES (불변)
    parent_code         text references bo_menu (code),
    name                text not null,
    path                text unique,              -- 그룹은 null
    sort_order          int not null,
    visible             boolean not null default true,
    use_create          boolean not null default false,
    use_read            boolean not null default false,
    use_update          boolean not null default false,
    use_delete          boolean not null default false,
    exclusive_role_code text references bo_role (code),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    check ((parent_code is null) = (path is null))
);

create table bo_role_menu (
    role_code  text references bo_role (code) on delete cascade,
    menu_code  text references bo_menu (code),
    can_create boolean not null default false,
    can_read   boolean not null default false,
    can_update boolean not null default false,
    can_delete boolean not null default false,
    primary key (role_code, menu_code),
    check (can_read or not (can_create or can_update or can_delete))
);

create table bo_user (
    id                       bigint generated always as identity primary key,
    email                    text not null,
    name                     text not null,
    department               text,
    role_code                text not null references bo_role (code),
    status                   text not null check (status in ('INVITED','ACTIVE','LOCKED','INACTIVE')),
    password_hash            text,
    password_changed_at      timestamptz,
    password_change_required boolean not null default false,
    failed_login_count       int not null default 0,
    lock_reason              text check (lock_reason in ('PASSWORD_FAILED','DORMANT')),
    locked_at                timestamptz,
    last_login_at            timestamptz,
    invite_token_hash        text unique,
    invite_expires_at        timestamptz,
    invited_by               bigint references bo_user (id),
    created_at               timestamptz not null default now(),
    updated_at               timestamptz not null default now(),
    check ((status = 'LOCKED') = (lock_reason is not null)),
    check (status = 'INVITED' or password_hash is not null)
);
create unique index bo_user_email_uq on bo_user (lower(email));

create table bo_refresh_token (
    id         bigint generated always as identity primary key,
    user_id    bigint not null references bo_user (id),
    token_hash text not null unique,
    expires_at timestamptz not null,
    user_agent text,
    ip         inet,
    created_at timestamptz not null default now()
);
create index on bo_refresh_token (user_id);

create table bo_login_history (
    id         bigint generated always as identity primary key,
    user_id    bigint references bo_user (id),
    email      text not null,
    result     text not null check (result in ('SUCCESS','FAILED','LOCKED')),
    ip         inet,
    user_agent text,
    created_at timestamptz not null default now()
);
create index on bo_login_history (user_id, created_at desc);
```

## 4. 시드 — `V2__bo_role_menu_seed.sql`

- 역할 7개: `SUPER_ADMIN`(is_super), `OPS_ADMIN`, `CS`, `MD`, `SETTLEMENT`, `MARKETING`, `VIEWER`
- 그룹 6개: `OPS` 운영, `PRD` 상품, `MKT` 마케팅, `MBR` 회원, `STL` 정산, `SYS` 시스템
- 메뉴 18개(코드 `그룹_메뉴`):

| 그룹 | 코드 | 이름 | 경로 | 사용 동작 | 전용 역할 |
|---|---|---|---|---|---|
| OPS | `OPS_DASHBOARD` | 대시보드 | `/dashboard` | R | |
| OPS | `OPS_ORDERS` | 주문·배송 | `/orders` | CRUD | |
| OPS | `OPS_CLAIMS` | 클레임·반품 | `/claims` | CRU | |
| OPS | `OPS_INQUIRIES` | 문의·리뷰 | `/inquiries` | RUD | |
| OPS | `OPS_LIVE` | 라이브 방송 (미노출) | `/live` | 구현 시 결정 | |
| PRD | `PRD_PRODUCTS` | 상품 관리 | `/products` | CRUD | |
| PRD | `PRD_STOCK` | 재고·사이즈 | `/stock` | RU | |
| PRD | `PRD_DISPLAY` | 카테고리·전시 | `/display` | CRUD | |
| MKT | `MKT_PROMOTIONS` | 프로모션·쿠폰 | `/promotions` | CRU | |
| MKT | `MKT_CONTENTS` | 기획전·콘텐츠 | `/contents` | R | |
| MBR | `MBR_MEMBERS` | 회원 관리 | `/members` | R | |
| MBR | `MBR_GRADES` | 등급·혜택 | `/grades` | CRUD | `SUPER_ADMIN` |
| STL | `STL_SETTLEMENT` | 정산·매출 | `/settlement` | R | |
| STL | `STL_TAX` | 세금계산서 | `/tax` | CRUD | `SETTLEMENT` |
| SYS | `SYS_MENUS` | 메뉴 관리 | `/menus` | CRUD | `SUPER_ADMIN` |
| SYS | `SYS_USERS` | 사용자 관리 | `/users` | R | |
| SYS | `SYS_ROLES` | 권한 관리 | `/roles` | R | |
| SYS | `SYS_AUDIT` | 감사 로그 | `/audit` | CRUD | `SUPER_ADMIN` |

- 사용 동작은 운영 관리자 격자의 `-` 칸 기준이다. 전용 메뉴는 격자에서 모두 disabled라 `-`를 알 수 없어 CRUD로 둔다.
- `SYS_USERS`·`SYS_ROLES`는 R만 쓴다. 두 메뉴의 쓰기는 모두 슈퍼관리자 전용이다(A2).
- 역할별 권한: 운영 관리자는 격자 그대로. 나머지는 roles.html 역할 목록 요약에서 추정.
- 슈퍼관리자 계정은 시드가 아니라 기동 시 부트스트랩(Q16).

## 5. API 결정 기록

| # | 주제 | 결정 | 이유 |
|---|---|---|---|
| A1 | 토큰 전달 | Next.js BFF(Route Handler·Server Action)가 access·refresh를 HttpOnly 쿠키로 보관하고 API 호출 시 `Authorization: Bearer`를 붙인다. API의 로그인·갱신·로그아웃은 JSON 본문으로 토큰을 주고받는다. CORS·CSRF 없음. 로그인 이력의 IP·UA는 BFF가 넘긴 `X-Forwarded-For`·`User-Agent` | 브라우저 JS에 토큰 비노출. API는 무상태 유지 |
| A2 | 시스템 메뉴 권한 | `SYS_USERS`·`SYS_ROLES`는 R만 부여 가능. 조회 API는 `SYS_USERS:R`/`SYS_ROLES:R`, 쓰기 API는 전부 `SUPER` | 디자인과 일치. 권한 상승 경로 차단. 위임이 필요해지면 상승 방지 규칙과 함께 연다 |
| A3 | 엔드포인트 | 6장 | |
| A4 | 슈퍼관리자 보호 | 자기 자신 비활성화·역할 변경, 마지막 ACTIVE 슈퍼관리자 비활성화·강등은 409. 슈퍼관리자가 모두 잠기면 okf에 적은 수동 SQL로 복구 | 아무도 풀 수 없는 상태 방지. DB 접근 권한 = 복구 권한 |
| A5 | 에러 형식 | RFC 9457 ProblemDetail + `code` 속성(`spring.mvc.problemdetails.enabled: true`). `ErrorResponseException`을 상속한 `ApiException(status, code, detail)` 하나. 입력 검증은 요청 record 안에서 직접 | 같은 상태 코드의 이유 구분. 새 의존성 없음 |
| A6 | 코드 구조 | 기능별 패키지 `auth`, `user`, `role`, `menu`, `config`, `common`. Controller → Service(`@Transactional`, 규칙 검증, 인터페이스 없음) → Mapper + XML | 트랜잭션과 규칙이 Service 한 곳에 모임 |
| A7 | sample 코드 | `hoka-bo-api`의 `sample` 패키지·`SampleMapper.xml`·`SampleControllerTests` 삭제(기능과 별도 커밋). FO·batch는 유지 | `sample` DDL이 없어 새 로컬 DB에서 테스트 실패 |
| A8 | 테스트 DB | Testcontainers PostgreSQL(`@ServiceConnection`) + Flyway V1·V2 | 로컬 개발 데이터 보호. 마이그레이션 검증 |
| A9 | 테스트 대상 | TDD 테스트는 Service 계층만. `@SpringBootTest`(webEnvironment 기본값 MOCK — `NONE`은 `SecurityConfig`가 요구하는 `HttpSecurity` 빈이 없어 컨텍스트가 뜨지 않는다), Mapper mock 없이 실제 DB. `@PreAuthorize`를 Service 메서드에 두어 인가도 Service 테스트로 확인(`@WithMockUser(authorities = ...)` → `AccessDeniedException`). 401·JWT 검증은 curl 수동 확인 절차로 | 인가 규칙까지 Service 테스트 범위에 포함 |
| A10 | JWT 서명 | HS256, `BO_JWT_SECRET`(32바이트 이상). `NimbusJwtEncoder`/`NimbusJwtDecoder` | 발급·검증이 같은 서버. 다른 서비스가 검증해야 하면 RS256으로 |
| A11 | 프로파일 | 이번에 `local`만 도입. `application.yaml`은 기본값 없는 환경변수(`${BO_JWT_SECRET}` 등), 로컬 기본값(DB·관리자·JWT·프론트 주소)은 `application-local.yaml`. 운영은 환경변수. 나중에 `dev`·`stg`·`prod` 추가. FO는 이번에 바꾸지 않음 | 운영에서 환경변수 누락 시 기동 실패 |

## 6. 엔드포인트

권한: `공개` = 인증 없음, `로그인` = 유효한 access 토큰, 그 외는 authority. 슈퍼관리자는 `SUPER`를 가지며 모든 메뉴 authority 검사를 통과한다. `password_change_required` 사용자는 authority `PASSWORD_CHANGE_REQUIRED` 하나만 받는다.

### 인증

| 메서드 | 경로 | 권한 | 내용 |
|---|---|---|---|
| POST | `/api/auth/login` | 공개 | `{email, password, rememberMe}` → `{accessToken, refreshToken, expiresIn}`. 실패 누적·잠금·90일 판단·이력 기록 |
| POST | `/api/auth/refresh` | 공개 | `{refreshToken}` → 새 토큰 쌍(rotation) |
| POST | `/api/auth/logout` | 공개 | `{refreshToken}` → 204, 해당 refresh 삭제 |
| GET | `/api/auth/me` | 로그인 | 내 정보 + 접근 가능한 메뉴 트리(`visible`만) + 메뉴별 CRUD |
| PUT | `/api/auth/password` | 로그인 | `{currentPassword, newPassword}`. `password_change_required` 사용자가 쓸 수 있는 API는 이것과 `me`·`logout`뿐 |
| GET | `/api/invitations/{token}` | 공개 | 초대 유효성 확인(이메일·이름) |
| POST | `/api/invitations/{token}/accept` | 공개 | `{password}` → ACTIVE |

### 메뉴·역할

| 메서드 | 경로 | 권한 | 내용 |
|---|---|---|---|
| GET | `/api/menus` | `SYS_ROLES:R` | 전체 트리(`use_*`, 전용 역할 포함) |
| GET | `/api/roles` | `SYS_ROLES:R` | 목록 + 소속 사용자 수 + 부여 메뉴 수 |
| GET | `/api/roles/{code}` | `SYS_ROLES:R` | 역할 정보 + 소속 사용자 + 메뉴별 권한 |
| POST | `/api/roles` | `SUPER` | `{code, name, description}` |
| PUT | `/api/roles/{code}` | `SUPER` | `{name, description}`. 슈퍼 역할 거부 |
| DELETE | `/api/roles/{code}` | `SUPER` | 소속 사용자·전용 메뉴 있으면 409, 슈퍼 역할 거부 |
| PUT | `/api/roles/{code}/permissions` | `SUPER` | `[{menuCode, c, r, u, d}]` 통째로 교체. 그룹 메뉴·`use_*` 위반·전용 메뉴·C/U/D에 R 없음은 400. 슈퍼 역할 거부 |

### 사용자

| 메서드 | 경로 | 권한 | 내용 |
|---|---|---|---|
| GET | `/api/users` | `SYS_USERS:R` | `q`(이름·이메일·부서), `status`(복수), `role`, `department`, `page`(0부터), `size`(기본 20, 최대 100). 최근 접속순. 응답 `{items, total, statusCounts}` |
| GET | `/api/users/departments` | `SYS_USERS:R` | 부서 필터 후보 |
| GET | `/api/users/{id}` | `SYS_USERS:R` | 상세 + 초대자 이름 + 접근 가능한 메뉴 |
| GET | `/api/users/{id}/login-history` | `SYS_USERS:R` | `limit` 기본 20 |
| POST | `/api/users` | `SUPER` | 초대 `{email, name, department, roleCode}` → `{user, inviteUrl}` |
| POST | `/api/users/{id}/invitation` | `SUPER` | 재초대(토큰 재발급) → `{inviteUrl}` |
| PATCH | `/api/users/{id}` | `SUPER` | `{name, department, roleCode}` |
| POST | `/api/users/{id}/unlock` | `SUPER` | 잠금 해제 + 임시 비밀번호 → `{temporaryPassword}` |
| POST | `/api/users/{id}/password-reset` | `SUPER` | 임시 비밀번호 + refresh 삭제 → `{temporaryPassword}` |
| POST | `/api/users/deactivate` | `SUPER` | `{ids: [...]}` 단건·일괄. refresh 삭제 |
| PATCH | `/api/users/role` | `SUPER` | `{ids: [...], roleCode}` 일괄 역할 변경 |

제외: CSV 내보내기, 문의 재배정, 역할 복제, 변경 이력, 재활성화.

## 7. 세부 규칙

| 항목 | 규칙 |
|---|---|
| 비밀번호 해시 | `PasswordEncoderFactories.createDelegatingPasswordEncoder()`(bcrypt) |
| 비밀번호 규칙 | 8자 이상, 현재 비밀번호와 달라야 함 |
| 임시 비밀번호 | `SecureRandom` 12자. 발급 시 `password_change_required = true`. 메일 발송이 없어 응답으로 한 번만 반환 |
| 로그인 실패 | `failed_login_count` 증가, 5회째 `LOCKED`/`PASSWORD_FAILED` + 이력 `LOCKED` |
| 로그인 성공 | `failed_login_count = 0`, `last_login_at = now()`, 이력 `SUCCESS` |
| 90일 미접속 | 로그인 시 `coalesce(last_login_at, password_changed_at) < now() - 90일`이면 `LOCKED`/`DORMANT` 후 거부 |
| 로그인 실패 응답 | 비밀번호 틀림·없는 이메일·INVITED·INACTIVE는 모두 401 `INVALID_CREDENTIALS`(남은 횟수 없음). LOCKED는 401 `ACCOUNT_LOCKED` + `lockReason` |
| access 토큰 | HS256, 15분, 클레임 `sub`(user id)만 |
| refresh 토큰 | 랜덤 문자열, SHA-256 해시 저장. 사용 시 rotation. 만료 30일(`rememberMe`) / 12시간. 모르거나 만료된 토큰은 401(계열 폐기 없음) |
| 요청별 권한 | `bo_user` ⨝ `bo_role` ⨝ `bo_role_menu` 1회 조회. `status <> 'ACTIVE'`면 401. 권한은 `{menu_code}:{C|R|U|D}` authority로 변환 |
| 초대 링크 | `BO_FRONT_BASE_URL` + `/invite/{token}`, 만료 24시간 |
| 첫 슈퍼관리자 | 슈퍼 역할 사용자가 0명이면 기동 시 `BO_ADMIN_EMAIL`/`BO_ADMIN_PASSWORD`로 생성, `password_change_required = true` |

## 8. 설정

| 환경변수 | `application-local.yaml` 기본값 |
|---|---|
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | `jdbc:postgresql://localhost:5432/appdb` / `app` / `app` |
| `BO_JWT_SECRET` | 로컬 전용 32바이트 이상 문자열 |
| `BO_ADMIN_EMAIL` / `BO_ADMIN_PASSWORD` | `admin@hoka.co.kr` / `admin1234!` |
| `BO_FRONT_BASE_URL` | `http://localhost:3000` |

- Flyway history 테이블: `spring.flyway.table: bo_flyway_schema_history`
- Flyway baseline: `baseline-on-migrate: true` + **`baseline-version: 0`**. `public`에 다른 프로젝트 테이블(`sample`, `users`)이 이미 있어 baseline 없이는 기동이 멈춘다. baseline 버전을 기본값 1로 두면 `V1`이 적용된 것으로 기록돼 `bo_*` 테이블이 생기지 않는다.
- 로컬 실행: `./mvnw spring-boot:run -Dspring-boot.run.profiles=local`

## 9. 구현 순서

1. ✅ BO sample 삭제 → `./mvnw test` 통과 → 커밋
2. ✅ 의존성(Flyway, OAuth2 Resource Server, Testcontainers)·`local` 프로파일·Flyway V1/V2 → local 기동 시 테이블·시드 생성 확인
3. ✅ Service TDD: menu/role → user → auth(로그인·토큰). 규칙마다 실패하는 테스트 먼저 (테스트 47개)
4. ✅ SecurityConfig(JWT)·Controller·부트스트랩 → curl 수동 확인
5. 문서 갱신 → `uv run --with pyyaml python okf/.okf/okf_check.py okf`

### 4단계 curl 확인 절차

`./mvnw spring-boot:run -Dspring-boot.run.profiles=local`로 띄운 뒤 순서대로 확인한다. 괄호는 2026-09-16 확인 결과다.

| # | 확인 | 기대 |
|---|---|---|
| 1 | 토큰 없이 `GET /api/roles` | 401 ✅ |
| 2 | `POST /api/auth/login` (부트스트랩 관리자) | 200, 토큰 쌍 ✅ |
| 3 | `GET /api/auth/me` | 200 ✅ |
| 4 | 임시 비밀번호 상태에서 `GET /api/roles` | 403 ✅ |
| 5 | `PUT /api/auth/password` | 204 ✅ |
| 6~9 | 새 비밀번호로 로그인 후 `/api/roles`·`/api/menus`·`/api/users` | 200 ✅ |
| 10 | `POST /api/auth/refresh` | 200, 새 토큰 ✅ |
| 11 | 방금 쓴 refresh 재사용 | 401 ✅ |
| 12 | 잘못된 access 토큰 | 401 ✅ |

확인 과정에서 로컬 관리자 비밀번호를 바꾸므로, 로컬 DB를 유지한 채 다시 확인하려면 5단계에서 정한 비밀번호를 쓰거나 `bo_user` 행을 지우고 재기동한다(부트스트랩이 다시 만든다).
   - `okf/projects/hoka-bo-api.md`(Stack·Commands·Notes)
   - `okf/architecture/sample-crud.md`(FO 전용으로)
   - `okf/architecture/system-overview.md`(인증 방식)
   - 새 개념 `okf/architecture/bo-auth.md`(API 계약·에러 코드·슈퍼관리자 잠금 복구 절차·curl 확인 절차) + `index.md`·`log.md`
   - `CLAUDE.md`(BO 명령·FO/BO 차이)
