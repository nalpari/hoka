-- 역할 7개와 메뉴 트리(그룹 6 + 메뉴 18), 역할별 권한. hoka-bo-front/ref/design 시안 기준.
-- 슈퍼관리자 계정은 여기서 만들지 않는다(기동 시 부트스트랩).

insert into bo_role (code, name, description, is_super) values
    ('SUPER_ADMIN', '슈퍼관리자', '모든 메뉴와 시스템 설정. 권한 행 없이 항상 전부 허용한다.', true),
    ('OPS_ADMIN', '운영 관리자', '주문·출고·클레임과 상품 운영을 맡는 이커머스팀 담당자.', false),
    ('CS', 'CS 담당', '문의·클레임 처리와 주문 조회.', false),
    ('MD', 'MD', '상품·재고·전시 운영.', false),
    ('SETTLEMENT', '정산 담당', '정산·세금계산서와 주문 조회.', false),
    ('MARKETING', '마케팅', '프로모션·기획전 운영과 회원 조회.', false),
    ('VIEWER', '조회 전용', '대시보드·주문·재고 조회만 가능.', false);

-- 그룹: 경로가 없고 권한도 붙지 않는다.
insert into bo_menu (code, parent_code, name, path, sort_order) values
    ('OPS', null, '운영', null, 1),
    ('PRD', null, '상품', null, 2),
    ('MKT', null, '마케팅', null, 3),
    ('MBR', null, '회원', null, 4),
    ('STL', null, '정산', null, 5),
    ('SYS', null, '시스템', null, 6);

insert into bo_menu (code, parent_code, name, path, sort_order, visible,
                     use_create, use_read, use_update, use_delete, exclusive_role_code) values
    ('OPS_DASHBOARD',  'OPS', '대시보드',      '/dashboard',  1, true,  false, true,  false, false, null),
    ('OPS_ORDERS',     'OPS', '주문·배송',     '/orders',     2, true,  true,  true,  true,  true,  null),
    ('OPS_CLAIMS',     'OPS', '클레임·반품',   '/claims',     3, true,  true,  true,  true,  false, null),
    ('OPS_INQUIRIES',  'OPS', '문의·리뷰',     '/inquiries',  4, true,  false, true,  true,  true,  null),
    -- v13 초안에서 추가된 미노출 메뉴. 방송 일정이 잡히면 visible을 켠다.
    ('OPS_LIVE',       'OPS', '라이브 방송',   '/live',       5, false, true,  true,  true,  true,  null),
    ('PRD_PRODUCTS',   'PRD', '상품 관리',     '/products',   1, true,  true,  true,  true,  true,  null),
    ('PRD_STOCK',      'PRD', '재고·사이즈',   '/stock',      2, true,  false, true,  true,  false, null),
    ('PRD_DISPLAY',    'PRD', '카테고리·전시', '/display',    3, true,  true,  true,  true,  true,  null),
    ('MKT_PROMOTIONS', 'MKT', '프로모션·쿠폰', '/promotions', 1, true,  true,  true,  true,  false, null),
    ('MKT_CONTENTS',   'MKT', '기획전·콘텐츠', '/contents',   2, true,  true,  true,  true,  false, null),
    ('MBR_MEMBERS',    'MBR', '회원 관리',     '/members',    1, true,  false, true,  false, false, null),
    ('MBR_GRADES',     'MBR', '등급·혜택',     '/grades',     2, true,  true,  true,  true,  true,  'SUPER_ADMIN'),
    ('STL_SETTLEMENT', 'STL', '정산·매출',     '/settlement', 1, true,  false, true,  true,  false, null),
    ('STL_TAX',        'STL', '세금계산서',    '/tax',        2, true,  true,  true,  true,  true,  'SETTLEMENT'),
    ('SYS_MENUS',      'SYS', '메뉴 관리',     '/menus',      1, true,  true,  true,  true,  true,  'SUPER_ADMIN'),
    -- 사용자·권한 관리의 쓰기는 슈퍼관리자 전용이라 조회 권한만 부여할 수 있다.
    ('SYS_USERS',      'SYS', '사용자 관리',   '/users',      2, true,  false, true,  false, false, null),
    ('SYS_ROLES',      'SYS', '권한 관리',     '/roles',      3, true,  false, true,  false, false, null),
    ('SYS_AUDIT',      'SYS', '감사 로그',     '/audit',      4, true,  true,  true,  true,  true,  'SUPER_ADMIN');

-- 역할별 권한. 슈퍼관리자는 행을 만들지 않는다(코드에서 전부 허용).
-- 운영 관리자는 roles.html 격자 그대로, 나머지는 역할 목록의 요약에서 옮겼다.
insert into bo_role_menu (role_code, menu_code, can_create, can_read, can_update, can_delete) values
    -- 운영 관리자 13/18
    ('OPS_ADMIN', 'OPS_DASHBOARD',  false, true,  false, false),
    ('OPS_ADMIN', 'OPS_ORDERS',     true,  true,  true,  false),
    ('OPS_ADMIN', 'OPS_CLAIMS',     true,  true,  true,  false),
    ('OPS_ADMIN', 'OPS_INQUIRIES',  false, true,  true,  false),
    ('OPS_ADMIN', 'PRD_PRODUCTS',   true,  true,  true,  true),
    ('OPS_ADMIN', 'PRD_STOCK',      false, true,  true,  false),
    ('OPS_ADMIN', 'PRD_DISPLAY',    true,  true,  true,  false),
    ('OPS_ADMIN', 'MKT_PROMOTIONS', true,  true,  false, false),
    ('OPS_ADMIN', 'MKT_CONTENTS',   false, true,  false, false),
    ('OPS_ADMIN', 'MBR_MEMBERS',    false, true,  false, false),
    ('OPS_ADMIN', 'STL_SETTLEMENT', false, true,  false, false),
    ('OPS_ADMIN', 'SYS_USERS',      false, true,  false, false),
    ('OPS_ADMIN', 'SYS_ROLES',      false, true,  false, false),
    -- CS 담당 5/18 (users.html 상세의 '접근 가능한 메뉴'와 같다)
    ('CS', 'OPS_DASHBOARD', false, true,  false, false),
    ('CS', 'OPS_ORDERS',    false, true,  false, false),
    ('CS', 'OPS_CLAIMS',    true,  true,  true,  false),
    ('CS', 'OPS_INQUIRIES', false, true,  true,  false),
    ('CS', 'MBR_MEMBERS',   false, true,  false, false),
    -- MD 6/18
    ('MD', 'OPS_DASHBOARD', false, true,  false, false),
    ('MD', 'OPS_ORDERS',    false, true,  false, false),
    ('MD', 'PRD_PRODUCTS',  true,  true,  true,  true),
    ('MD', 'PRD_STOCK',     false, true,  true,  false),
    ('MD', 'PRD_DISPLAY',   true,  true,  true,  false),
    ('MD', 'MKT_CONTENTS',  false, true,  false, false),
    -- 정산 담당 4/18
    ('SETTLEMENT', 'OPS_DASHBOARD',  false, true,  false, false),
    ('SETTLEMENT', 'OPS_ORDERS',     false, true,  false, false),
    ('SETTLEMENT', 'STL_SETTLEMENT', false, true,  true,  false),
    ('SETTLEMENT', 'STL_TAX',        true,  true,  true,  false),
    -- 마케팅 5/18. 시안의 '등급 조회'는 등급·혜택이 슈퍼관리자 전용이라 줄 수 없어 회원 조회로 둔다.
    ('MARKETING', 'OPS_DASHBOARD',  false, true,  false, false),
    ('MARKETING', 'OPS_ORDERS',     false, true,  false, false),
    ('MARKETING', 'MKT_PROMOTIONS', true,  true,  true,  false),
    ('MARKETING', 'MKT_CONTENTS',   true,  true,  true,  false),
    ('MARKETING', 'MBR_MEMBERS',    false, true,  false, false),
    -- 조회 전용 4/18
    ('VIEWER', 'OPS_DASHBOARD', false, true, false, false),
    ('VIEWER', 'OPS_ORDERS',    false, true, false, false),
    ('VIEWER', 'PRD_PRODUCTS',  false, true, false, false),
    ('VIEWER', 'PRD_STOCK',     false, true, false, false);
