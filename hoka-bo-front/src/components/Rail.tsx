import Link from "next/link";

import type { Me, MenuAccess } from "@/lib/me";

import { Avatar } from "./Avatar";
import { Brandmark, Icon } from "./Icon";
import { isIconName } from "./icons";

// 레일은 메뉴 관리(/menus)가 저장한 트리를 그대로 그린다. 순서·이름·아이콘·노출 여부는 모두 API가 준다.
// me.menus에는 조회 권한이 있고 레일에 표시로 둔 메뉴만 들어 있다.
function byGroup(menus: MenuAccess[]) {
  const groups: { code: string; name: string; items: MenuAccess[] }[] = [];
  for (const menu of menus) {
    const last = groups.at(-1);
    if (last?.code === menu.parentCode) {
      last.items.push(menu);
    } else {
      groups.push({ code: menu.parentCode, name: menu.groupName, items: [menu] });
    }
  }
  return groups;
}

export function Rail({ me, activeMenuCode }: { me: Me; activeMenuCode: string }) {
  const groups = byGroup(me.menus);

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
          <div className="navgroup" key={group.code}>
            <span className="navgroup__label">{group.name}</span>
            {group.items.map((item) => {
              const active = item.code === activeMenuCode;
              return (
                <Link
                  className={active ? "navitem is-active" : "navitem"}
                  href={item.path}
                  key={item.code}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon name={isIconName(item.icon) ? item.icon : "file"} size={17} />
                  <span>{item.name}</span>
                  <span />
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="rail__foot">
        <button className="userchip" type="button">
          <Avatar id={me.id} name={me.name} updatedAt={me.avatarUpdatedAt} />
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
