import { logout } from "@/app/login/actions";
import type { Me } from "@/lib/me";

import { Icon } from "./Icon";
import { Rail } from "./Rail";
import { RailToggle } from "./RailToggle";

// 모든 백오피스 화면이 쓰는 셸. 좌측 레일 + 톱바 + 본문.
export function Shell({
  me,
  activeMenuCode,
  title,
  children,
}: {
  me: Me;
  activeMenuCode: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="app">
      <Rail me={me} activeMenuCode={activeMenuCode} />
      <div className="main">
        <header className="topbar">
          <RailToggle />
          <span className="topbar__title">{title}</span>
          <div className="topbar__actions">
            {/* 알림·도움말은 아직 기능이 없다. 테마 전환은 별도 작업으로 미뤘다. */}
            <button className="btn btn--ghost btn--icon btn--sm" type="button" aria-label="알림" title="알림">
              <Icon name="bell" size={16} />
            </button>
            <button className="btn btn--ghost btn--icon btn--sm" type="button" aria-label="도움말" title="도움말">
              <Icon name="help" size={16} />
            </button>
            <form action={logout}>
              <button className="btn btn--secondary btn--sm" type="submit">
                <Icon name="logout" size={15} />
                로그아웃
              </button>
            </form>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
