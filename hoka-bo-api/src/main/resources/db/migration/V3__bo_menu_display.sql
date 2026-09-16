-- 메뉴 관리 화면(SYS_MENUS)이 편집하는 표시 정보.
-- icon은 레일이 그릴 아이콘 이름으로, 그동안 프론트 Rail.tsx의 NAV 상수가 들고 있던 값을 여기로 옮긴다.
-- 그룹은 레일에 아이콘을 그리지 않으므로 null로 둔다.
alter table bo_menu add column icon text;
alter table bo_menu add column description text;

update bo_menu set icon = source.icon
from (values
    ('OPS_DASHBOARD',  'home'),
    ('OPS_ORDERS',     'truck'),
    ('OPS_CLAIMS',     'undo'),
    ('OPS_INQUIRIES',  'message'),
    ('OPS_LIVE',       'smartphone'),
    ('PRD_PRODUCTS',   'box'),
    ('PRD_STOCK',      'ruler'),
    ('PRD_DISPLAY',    'layers'),
    ('MKT_PROMOTIONS', 'tag'),
    ('MKT_CONTENTS',   'image'),
    ('MBR_MEMBERS',    'users'),
    ('MBR_GRADES',     'star'),
    ('STL_SETTLEMENT', 'wallet'),
    ('STL_TAX',        'receipt'),
    ('SYS_MENUS',      'sitemap'),
    ('SYS_USERS',      'user'),
    ('SYS_ROLES',      'shield'),
    ('SYS_AUDIT',      'file')
) as source (code, icon)
where bo_menu.code = source.code;
