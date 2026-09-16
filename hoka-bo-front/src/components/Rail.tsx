import Link from "next/link";

import type { Me } from "@/lib/me";

import { Brandmark, Icon, type IconName } from "./Icon";

// 시안 app.js의 NAV와 같은 구조다. menuCode는 API 시드의 메뉴 코드와 맞춘다.
// href가 "#"인 항목은 아직 화면이 없다.
type NavItem = {
  menuCode: string;
  href: string;
  icon: IconName;
  text: string;
  count?: string;
  risk?: boolean;
};

const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "운영",
    items: [
      { menuCode: "OPS_DASHBOARD", href: "/dashboard", icon: "home", text: "대시보드" },
      { menuCode: "OPS_ORDERS", href: "#", icon: "truck", text: "주문·배송", count: "27", risk: true },
      { menuCode: "OPS_CLAIMS", href: "#", icon: "undo", text: "클레임·반품", count: "6" },
      { menuCode: "OPS_INQUIRIES", href: "#", icon: "message", text: "문의·리뷰", count: "14" },
    ],
  },
  {
    label: "상품",
    items: [
      { menuCode: "PRD_PRODUCTS", href: "#", icon: "box", text: "상품 관리" },
      { menuCode: "PRD_STOCK", href: "#", icon: "ruler", text: "재고·사이즈", count: "9", risk: true },
      { menuCode: "PRD_DISPLAY", href: "#", icon: "layers", text: "카테고리·전시" },
    ],
  },
  {
    label: "마케팅",
    items: [
      { menuCode: "MKT_PROMOTIONS", href: "#", icon: "tag", text: "프로모션·쿠폰" },
      { menuCode: "MKT_CONTENTS", href: "#", icon: "image", text: "기획전·콘텐츠" },
    ],
  },
  {
    label: "회원",
    items: [
      { menuCode: "MBR_MEMBERS", href: "#", icon: "users", text: "회원 관리" },
      { menuCode: "MBR_GRADES", href: "#", icon: "star", text: "등급·혜택" },
    ],
  },
  {
    label: "정산",
    items: [
      { menuCode: "STL_SETTLEMENT", href: "#", icon: "wallet", text: "정산·매출" },
      { menuCode: "STL_TAX", href: "#", icon: "receipt", text: "세금계산서" },
    ],
  },
  {
    label: "시스템",
    items: [
      { menuCode: "SYS_MENUS", href: "#", icon: "sitemap", text: "메뉴 관리" },
      { menuCode: "SYS_USERS", href: "#", icon: "user", text: "사용자 관리" },
      { menuCode: "SYS_ROLES", href: "#", icon: "shield", text: "권한 관리" },
      { menuCode: "SYS_AUDIT", href: "#", icon: "file", text: "감사 로그" },
    ],
  },
];

export function Rail({ me, activeMenuCode }: { me: Me; activeMenuCode: string }) {
  // 접근 권한이 없는 메뉴는 아예 보여 주지 않는다. 권한 판단은 API가 한 것을 그대로 쓴다.
  const allowed = new Set(me.menus.map((menu) => menu.code));
  const groups = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => allowed.has(item.menuCode)),
  })).filter((group) => group.items.length > 0);

  return (
    <aside className="rail" id="rail">
      <Link className="rail__brand" href="/dashboard">
        <Brandmark />
        <b className="wordmark">HOKA</b>
        <span className="rail__tag">백오피스</span>
      </Link>

      {/* 검색은 아직 동작하지 않는다. 시안의 자리만 지킨다. */}
      <div className="rail__search">
        <Icon name="search" size={14} />
        <input type="search" placeholder="주문번호·상품·회원 검색" aria-label="검색" disabled />
        <kbd>⌘K</kbd>
      </div>

      <nav className="rail__nav" aria-label="주요 메뉴">
        {groups.map((group) => (
          <div className="navgroup" key={group.label}>
            <span className="navgroup__label">{group.label}</span>
            {group.items.map((item) => {
              const active = item.menuCode === activeMenuCode;
              return (
                <Link
                  className={active ? "navitem is-active" : "navitem"}
                  href={item.href}
                  key={item.menuCode}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon name={item.icon} size={17} />
                  <span>{item.text}</span>
                  {item.count ? (
                    <span className={item.risk ? "navitem__count is-risk" : "navitem__count"}>{item.count}</span>
                  ) : (
                    <span />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="rail__foot">
        <div className="deploycard">
          <span className="deploycard__top">
            <span className="deploycard__name">메뉴 트리 v12</span>
            <span className="badge badge--ok">배포됨</span>
          </span>
          <span className="t-xs muted">09-12 18:40 · 김서연</span>
        </div>
        <button className="userchip" type="button">
          <span className="avatar initial">{me.name.slice(0, 1)}</span>
          <span>
            <span className="switcher__name">{me.name}</span>
            <span className="switcher__meta">
              {me.roleName}
              {me.department ? ` · ${me.department}` : ""}
            </span>
          </span>
          <Icon name="dots" size={15} />
        </button>
      </div>
    </aside>
  );
}
