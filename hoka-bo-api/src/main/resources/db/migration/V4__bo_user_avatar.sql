-- 프로필 사진. 외부 스토리지가 없어 DB에 둔다.
-- 저장 전에 서버가 128x128 PNG로 정규화하므로 한 행은 수십 KB다.
-- avatar_updated_at은 사진 유무(null이면 이니셜로 그린다)와 브라우저 캐시 무효화에 같이 쓴다.
alter table bo_user add column avatar bytea;
alter table bo_user add column avatar_updated_at timestamptz;

alter table bo_user add constraint bo_user_avatar_pair
    check ((avatar is null) = (avatar_updated_at is null));
