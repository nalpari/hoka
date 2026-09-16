import { redirect } from "next/navigation";

import { logout } from "@/app/login/actions";
import { Brandmark, Icon } from "@/components/Icon";
import { ApiError, callApi } from "@/lib/api";
import { readTokens } from "@/lib/session";

type MenuAccess = {
  code: string;
  parentCode: string | null;
  name: string;
  path: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

type Me = {
  id: number;
  email: string;
  name: string;
  department: string | null;
  roleCode: string;
  roleName: string;
  isSuper: boolean;
  passwordChangeRequired: boolean;
  menus: MenuAccess[];
};

// 레일·대시보드가 붙기 전까지 쓰는 임시 착지 페이지. 로그인 결과를 그대로 보여 준다.
export default async function HomePage() {
  const { accessToken } = await readTokens();
  if (!accessToken) {
    redirect("/login");
  }

  let me: Me;
  try {
    me = await callApi<Me>("/api/auth/me", { accessToken });
  } catch (error) {
    // 쿠키 쓰기는 렌더 중에 못 하므로 여기서는 보내기만 한다. 정리는 proxy와 로그아웃이 맡는다.
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      redirect("/login");
    }
    throw error;
  }

  return (
    <main className="page" style={{ maxWidth: 880, margin: "0 auto", padding: "var(--s-7) var(--s-5)" }}>
      <div className="flex flex--between" style={{ marginBottom: "var(--s-6)" }}>
        <span className="flex gap-2">
          <Brandmark />
          <b className="wordmark">HOKA</b>
          <span className="rail__tag" style={{ marginLeft: 2 }}>
            백오피스
          </span>
        </span>
        <form action={logout}>
          <button className="btn btn--secondary btn--sm" type="submit">
            로그아웃
          </button>
        </form>
      </div>

      {me.passwordChangeRequired ? (
        <div className="note note--warn mb-4">
          <Icon name="alert" size={16} />
          <div>
            <strong>임시 비밀번호로 로그인했습니다</strong>
            비밀번호를 바꾸기 전까지 다른 기능은 열리지 않습니다. 변경 화면은 곧 붙습니다.
          </div>
        </div>
      ) : null}

      <section className="panel">
        <div className="panel__head">
          <h3>로그인한 사용자</h3>
          <span className="t-xs dim">/api/auth/me</span>
        </div>
        <div className="panel__body">
          <dl className="deflist">
            <dt>이름</dt>
            <dd>{me.name}</dd>
            <dt>계정</dt>
            <dd>{me.email}</dd>
            <dt>부서</dt>
            <dd>{me.department ?? "-"}</dd>
            <dt>역할</dt>
            <dd>
              {me.roleName} <span className="dim">({me.roleCode})</span>
            </dd>
          </dl>
        </div>
        <div className="panel__body" style={{ borderTop: "1px solid var(--hairline)" }}>
          <div className="sechead">
            <h2>접근 가능한 메뉴</h2>
            <span className="t-xs dim">{me.menus.length}개</span>
          </div>
          {me.menus.length === 0 ? (
            <p className="t-sm muted">열린 메뉴가 없습니다.</p>
          ) : (
            <div className="flex gap-1 flex--wrap">
              {me.menus.map((menu) => (
                <span className="badge badge--outline" key={menu.code}>
                  {menu.name}
                  <span className="dim" style={{ marginLeft: 4 }}>
                    {actionsOf(menu)}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function actionsOf(menu: MenuAccess) {
  return [menu.canCreate && "C", menu.canRead && "R", menu.canUpdate && "U", menu.canDelete && "D"]
    .filter(Boolean)
    .join("");
}
