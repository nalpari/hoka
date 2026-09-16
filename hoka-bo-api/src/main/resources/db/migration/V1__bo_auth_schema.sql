-- 백오피스 사용자·역할·메뉴·권한. 설계 근거는 docs/bo-auth-design.md.
-- 기존 sample 테이블과는 무관하며 bo_ 접두사로 FO 도메인과 이름을 나눈다.

create table bo_role (
    code        text primary key,                 -- OPS_ADMIN. 배포 뒤 바꾸지 않는다.
    name        text not null unique,
    description text,
    is_super    boolean not null default false,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- 슈퍼관리자 역할은 하나뿐이다.
create unique index bo_role_single_super on bo_role (is_super) where is_super;

create table bo_menu (
    code                text primary key,         -- SYS_ROLES. 권한·감사 로그가 이 코드로 참조한다.
    parent_code         text references bo_menu (code),
    name                text not null,
    path                text unique,
    sort_order          int not null,
    visible             boolean not null default true,
    -- 메뉴가 실제로 쓰는 동작. 격자에서 '-'로 비는 칸이 false다.
    use_create          boolean not null default false,
    use_read            boolean not null default false,
    use_update          boolean not null default false,
    use_delete          boolean not null default false,
    -- 설정되면 그 역할(과 슈퍼관리자)만 이 메뉴 권한을 받을 수 있다.
    exclusive_role_code text references bo_role (code),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    -- 그룹은 경로가 없고, 메뉴는 경로가 있다. 그룹에는 권한을 붙이지 않는다(앱에서 검증).
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
    -- 조회 없이 등록·수정·삭제만 가진 조합은 만들지 않는다.
    check (can_read or not (can_create or can_update or can_delete))
);

create table bo_user (
    id                       bigint generated always as identity primary key,
    email                    text not null,
    name                     text not null,
    department               text,
    role_code                text not null references bo_role (code),
    status                   text not null check (status in ('INVITED', 'ACTIVE', 'LOCKED', 'INACTIVE')),
    password_hash            text,
    password_changed_at      timestamptz,
    password_change_required boolean not null default false,
    failed_login_count       int not null default 0,
    lock_reason              text check (lock_reason in ('PASSWORD_FAILED', 'DORMANT')),
    locked_at                timestamptz,
    last_login_at            timestamptz,
    invite_token_hash        text unique,
    invite_expires_at        timestamptz,
    invited_by               bigint references bo_user (id),
    created_at               timestamptz not null default now(),
    updated_at               timestamptz not null default now(),
    check ((status = 'LOCKED') = (lock_reason is not null)),
    -- 초대 대기 계정만 비밀번호가 없다.
    check (status = 'INVITED' or password_hash is not null)
);

-- 로그인 계정이므로 대소문자를 구분하지 않는다.
create unique index bo_user_email_uq on bo_user (lower(email));

create table bo_refresh_token (
    id         bigint generated always as identity primary key,
    user_id    bigint not null references bo_user (id),
    token_hash text not null unique,              -- 원문은 저장하지 않는다.
    expires_at timestamptz not null,
    user_agent text,
    ip         inet,
    created_at timestamptz not null default now()
);

create index bo_refresh_token_user_idx on bo_refresh_token (user_id);

create table bo_login_history (
    id         bigint generated always as identity primary key,
    user_id    bigint references bo_user (id),    -- 없는 이메일로 시도하면 null
    email      text not null,
    result     text not null check (result in ('SUCCESS', 'FAILED', 'LOCKED')),
    ip         inet,
    user_agent text,
    created_at timestamptz not null default now()
);

create index bo_login_history_user_idx on bo_login_history (user_id, created_at desc);
