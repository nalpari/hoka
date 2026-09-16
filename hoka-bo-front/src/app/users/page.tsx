import Link from "next/link";

import { Icon } from "@/components/Icon";
import { NoAccess, Shell } from "@/components/Shell";
import {
  PAGE_SIZE,
  STATUS_LABEL,
  USER_STATUSES,
  getLoginHistory,
  getRole,
  getUser,
  listDepartments,
  listMenus,
  listRoles,
  listUsers,
  type UserStatus,
} from "@/lib/bo";
import { requireMe } from "@/lib/me";

import { InvitePanel, UserDetailPanel } from "./user-forms";
import { UserTable } from "./user-table";

function one(value: string | string[] | undefined) {
  return typeof value === "string" && value ? value : undefined;
}

function many(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

// 시안 ref/design/users.html 기준. 목록 행은 전부 API가 내려 준 값이다 —
// 저장할 곳이 없는 2단계 인증 열은 시안에서 뺐다. 프로필 사진은 상세에서 올리고, 없으면 이니셜로 그린다.
// 스코프바의 브랜드스토어 칩과 CSV 내보내기, 목록 정렬은 아직 시안 표기로 남아 있다.
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const me = await requireMe();
  const title = (
    <>
      <span className="crumb">
        시스템 <Icon name="right" size={13} />
      </span>
      사용자 관리
    </>
  );

  if (!me.menus.some((menu) => menu.code === "SYS_USERS" && menu.canRead)) {
    return (
      <Shell me={me} activeMenuCode="SYS_USERS" title={title}>
        <NoAccess what="사용자 관리" />
      </Shell>
    );
  }

  const params = await searchParams;
  const q = one(params.q);
  const status = many(params.status).filter((value): value is UserStatus =>
    (USER_STATUSES as readonly string[]).includes(value),
  );
  const role = one(params.role);
  const department = one(params.department);
  const page = Math.max(0, Number(one(params.page) ?? 0) || 0);
  const inviting = params.invite === "1" && me.isSuper;
  const editing = params.edit === "1" && me.isSuper;
  const selectedId = Number(one(params.id) ?? NaN);

  // 역할·메뉴 조회는 SYS_ROLES:R을 요구한다. 사용자 관리 권한만 있는 역할도 목록은 볼 수 있어야 해서
  // 실패하면 역할 필터와 "접근 가능한 메뉴"만 접고 나머지는 그대로 보여 준다.
  const [users, roles, menus, departments] = await Promise.all([
    listUsers({ q, status, role, department, page }),
    listRoles().catch(() => []),
    listMenus().catch(() => []),
    listDepartments(),
  ]);

  const filters = new URLSearchParams();
  if (q) filters.set("q", q);
  status.forEach((value) => filters.append("status", value));
  if (role) filters.set("role", role);
  if (department) filters.set("department", department);
  const filterQuery = filters.toString();
  const join = (query: string) => (query ? `${query}&` : "");
  const listHref = `/users?${join(filterQuery)}page=${page}`;

  // 목록 결과와 무관하게 부른다. 잠금 해제·비활성화처럼 상태를 바꾸는 작업은 그 사용자를 현재 필터에서
  // 밀어내는데, 목록에 있을 때만 상세를 그리면 패널이 사라지면서 임시 비밀번호까지 같이 없어진다.
  const selected = Number.isInteger(selectedId) ? await getUser(selectedId).catch(() => null) : null;
  const [history, roleDetail] = selected
    ? await Promise.all([
        getLoginHistory(selected.id, 5),
        getRole(selected.roleCode).catch(() => null),
      ])
    : [[], null];

  const leaves = menus.filter((menu) => menu.parentCode !== null);
  const accessible = !roleDetail
    ? []
    : roleDetail.role.isSuper
      ? // 슈퍼관리자는 bo_role_menu에 행이 없고 암묵적으로 모든 메뉴를 쓴다.
        leaves.map((menu) => ({ name: menu.name, readOnly: false }))
      : roleDetail.permissions
          .filter((permission) => permission.canRead)
          .map((permission) => ({
            name: leaves.find((menu) => menu.code === permission.menuCode)?.name ?? permission.menuCode,
            readOnly: !permission.canCreate && !permission.canUpdate && !permission.canDelete,
          }));

  const counts = users.statusCounts;
  const summary = USER_STATUSES.filter((value) => counts[value])
    .map((value) => `${STATUS_LABEL[value]} ${counts[value]}`)
    .join(" · ");

  return (
    <Shell me={me} activeMenuCode="SYS_USERS" title={title}>
      <div className="scopebar">
        <span className="scopebar__lead">
          <Icon name="user" size={14} />
          설정 주체
        </span>
        {/* 멀티 스토어가 없어 고정 표기다. */}
        <button className="scope is-set" type="button" aria-disabled="true" title="아직 한 개 스토어만 있습니다">
          <Icon name="store" size={14} />
          <b>호카코리아</b> 브랜드스토어
        </button>
        <span className="scope">
          <Icon name="users" size={14} />
          전체 <b>{Object.values(counts).reduce((sum, value) => sum + (value ?? 0), 0)}</b>
          {summary ? ` · ${summary}` : ""}
        </span>
        {roles.length > 0 ? (
          <Link className="scope" href="/roles">
            <Icon name="shield" size={14} />
            역할 {roles.length}개
          </Link>
        ) : null}
        <span className="scopebar__spacer" />
        <button className="btn btn--secondary btn--sm" type="button" aria-disabled="true" title="준비 중인 기능입니다">
          <Icon name="download" size={14} />
          CSV 내보내기
        </button>
        {me.isSuper ? (
          <Link className="btn btn--primary btn--sm" href={`/users?${join(filterQuery)}invite=1`}>
            <Icon name="mail" size={14} />
            사용자 초대
          </Link>
        ) : null}
      </div>

      <main className="page">
        <div className="split">
          <section className="panel">
            {/* 네이티브 GET 폼이라 조건이 그대로 URL에 남는다. 새로고침·공유·뒤로가기가 공짜로 동작한다. */}
            <form className="toolbar" action="/users">
              <div className="toolbar__search">
                <Icon name="search" size={14} />
                <input
                  type="search"
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="이름 · 이메일 · 부서"
                  aria-label="사용자 검색"
                />
              </div>

              <div className="chips" role="group" aria-label="상태">
                {USER_STATUSES.map((value) => (
                  <label className="check" key={value}>
                    <input type="checkbox" name="status" value={value} defaultChecked={status.includes(value)} />
                    {STATUS_LABEL[value]}
                  </label>
                ))}
              </div>

              {roles.length > 0 ? (
                <select
                  className="select"
                  name="role"
                  defaultValue={role ?? ""}
                  style={{ width: 128, minHeight: 28 }}
                  aria-label="역할"
                >
                  <option value="">역할 전체</option>
                  {roles.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
              ) : null}

              <select
                className="select"
                name="department"
                defaultValue={department ?? ""}
                style={{ width: 118, minHeight: 28 }}
                aria-label="부서"
              >
                <option value="">부서 전체</option>
                {departments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <button className="btn btn--secondary btn--sm" type="submit">
                적용
              </button>
              {filterQuery ? (
                <Link className="btn btn--ghost btn--sm" href="/users">
                  초기화
                </Link>
              ) : null}

              <span className="grow" />
              <span className="toolbar__count">
                {users.total}명 중 {users.items.length}명
              </span>
            </form>

            <UserTable
              items={users.items}
              total={users.total}
              page={page}
              size={PAGE_SIZE}
              roles={roles}
              selectedId={selected?.id}
              canWrite={me.isSuper}
              filterQuery={filterQuery}
            />
          </section>

          {inviting ? (
            <InvitePanel roles={roles} departments={departments} backHref={listHref} />
          ) : selected ? (
            <UserDetailPanel
              key={`${selected.id}-${editing}`}
              user={selected}
              roles={roles}
              departments={departments}
              accessible={accessible}
              history={history}
              canWrite={me.isSuper}
              isSelf={me.id === selected.id}
              editing={editing}
              backHref={`${listHref}&id=${selected.id}`}
            />
          ) : (
            <section className="panel">
              <div className="empty">
                <span className="empty__mark">
                  <Icon name="user" size={20} />
                </span>
                <h3>사용자를 선택하세요</h3>
                <p>왼쪽 목록에서 이름을 누르면 계정 상태, 접근 가능한 메뉴, 최근 로그인을 볼 수 있습니다.</p>
              </div>
            </section>
          )}
        </div>
      </main>
    </Shell>
  );
}
