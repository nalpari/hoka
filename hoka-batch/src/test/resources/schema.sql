-- 운영 sample 테이블과 같은 구조. 실제 테이블 DDL은 저장소에 없다.
create table sample (
    id         bigserial primary key,
    name       text        not null,
    created_at timestamptz not null default now()
);
