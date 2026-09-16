"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";

import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { STATUS_LABEL, type Menu, type MenuPermission, type RoleDetail, type RoleSummary } from "@/lib/bo-types";

import { createRole, deleteRole, savePermissions, updateRole, type FormState } from "./actions";

type Cell = { c: boolean; r: boolean; u: boolean; d: boolean };
type Grid = Record<string, Cell>;

const EMPTY: Cell = { c: false, r: false, u: false, d: false };
const ACTIONS = ["c", "r", "u", "d"] as const;

// 시안의 "비고" 열. 운영 규칙을 담을 필드가 API에 없어 시안 문구를 그대로 둔 합성 자료다.
const NOTES: Record<string, string> = {
  OPS_DASHBOARD: "허용된 범위 안에서만 집계됩니다",
  OPS_ORDERS: "발주 확인·송장 등록·취소는 U에 포함",
  OPS_CLAIMS: "환불 승인은 건당 50만원까지",
  OPS_INQUIRIES: "리뷰 숨김은 CS 담당만",
  PRD_PRODUCTS: "신규 등록은 MD 승인 뒤 노출",
  PRD_STOCK: "발주 제안은 MD가 승인",
  MKT_PROMOTIONS: "발급 한도 월 500만원 · 09-30까지",
  MBR_MEMBERS: "연락처·주소는 마스킹 표시",
  STL_SETTLEMENT: "확정은 정산 담당만",
  SYS_USERS: "초대·잠금 해제는 슈퍼관리자만",
};

function toGrid(permissions: MenuPermission[]): Grid {
  const grid: Grid = {};
  for (const permission of permissions) {
    grid[permission.menuCode] = {
      c: permission.canCreate,
      r: permission.canRead,
      u: permission.canUpdate,
      d: permission.canDelete,
    };
  }
  return grid;
}

function toPermissions(grid: Grid): MenuPermission[] {
  return Object.entries(grid)
    .filter(([, cell]) => cell.c || cell.r || cell.u || cell.d)
    .map(([menuCode, cell]) => ({
      menuCode,
      canCreate: cell.c,
      canRead: cell.r,
      canUpdate: cell.u,
      canDelete: cell.d,
    }));
}

function countDiff(a: Grid, b: Grid, codes: string[]) {
  return codes.filter((code) => {
    const left = a[code] ?? EMPTY;
    const right = b[code] ?? EMPTY;
    return ACTIONS.some((action) => left[action] !== right[action]);
  }).length;
}

export function RoleEditor({
  roles,
  menus,
  detail,
  canWrite,
  creating,
}: {
  roles: RoleSummary[];
  menus: Menu[];
  detail: RoleDetail | null;
  canWrite: boolean;
  creating: boolean;
}) {
  const leaves = menus.filter((menu) => menu.parentCode !== null);
  const codes = leaves.map((menu) => menu.code);

  const [baseline, setBaseline] = useState<Grid>(toGrid(detail?.permissions ?? []));
  const [grid, setGrid] = useState<Grid>(baseline);
  const [name, setName] = useState(detail?.role.name ?? "");
  const [description, setDescription] = useState(detail?.role.description ?? "");
  const [gridError, setGridError] = useState<string>();
  const [blocked, setBlocked] = useState(false);
  const [saving, startSaving] = useTransition();

  const role = detail?.role;
  // 슈퍼관리자 역할은 항상 전부 허용이라 API가 수정을 거절한다(SUPER_ROLE_IMMUTABLE).
  const editable = canWrite && !!role && !role.isSuper;

  const gridDiff = countDiff(grid, baseline, codes);
  const infoDirty =
    !!role && (name !== role.name || description !== (role.description ?? ""));
  const dirty = gridDiff > 0 || infoDirty;

  const guard = (event: { preventDefault: () => void }) => {
    if (dirty) {
      event.preventDefault();
      setBlocked(true);
    }
  };

  const revert = () => {
    setGrid(baseline);
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setGridError(undefined);
    setBlocked(false);
  };

  const setCell = (code: string, next: Cell) => setGrid((was) => ({ ...was, [code]: next }));

  const toggle = (menu: Menu, action: (typeof ACTIONS)[number]) => {
    const cell = grid[menu.code] ?? EMPTY;
    const next = { ...cell, [action]: !cell[action] };
    // 조회를 끄면 등록·수정·삭제도 같이 꺼진다. API가 READ_REQUIRED로 거절하는 조합을 애초에 만들지 않는다.
    if (action === "r" && !next.r) {
      next.c = false;
      next.u = false;
      next.d = false;
    }
    setCell(menu.code, next);
  };

  const keepReadOnly = () =>
    setGrid((was) => {
      const next: Grid = {};
      for (const code of codes) {
        const cell = was[code] ?? EMPTY;
        if (cell.r) next[code] = { c: false, r: true, u: false, d: false };
      }
      return next;
    });

  const grantedCount = codes.filter((code) => {
    const cell = grid[code] ?? EMPTY;
    return cell.c || cell.r || cell.u || cell.d;
  }).length;

  const save = () => {
    if (!role) return;
    startSaving(async () => {
      const result = await savePermissions(role.code, toPermissions(grid));
      if (result.error) {
        setGridError(result.error);
        return;
      }
      setGridError(undefined);
      setBaseline(grid);
    });
  };

  return (
    <>
      <div className="scopebar">
        <span className="scopebar__lead">
          <Icon name="shield" size={14} />
          설정 주체
        </span>
        {/* 멀티 스토어가 없어 고정 표기다. */}
        <button className="scope is-set" type="button" aria-disabled="true" title="아직 한 개 스토어만 있습니다">
          <Icon name="store" size={14} />
          <b>호카코리아</b> 브랜드스토어
        </button>
        <span className="scope is-set">
          <Icon name="shield" size={14} />
          역할 <b>{creating ? "새 역할" : (role?.name ?? "-")}</b>
        </span>
        <span className="scope">
          <Icon name="users" size={14} />
          사용자 {detail?.members.length ?? 0}명
        </span>
        {/* 메뉴 트리 버전(초안/배포)이 없어 고정 표기다. */}
        <span className="scope">
          <Icon name="branch" size={14} />
          메뉴 트리 v12 기준
        </span>
        <span className="scopebar__spacer" />
        {editable ? (
          <>
            <button className="btn btn--ghost btn--sm" type="button" aria-disabled="true" title="준비 중인 기능입니다">
              변경 이력
            </button>
            <button className="btn btn--secondary btn--sm" type="button" aria-disabled="true" title="준비 중인 기능입니다">
              역할 복제
            </button>
            <button className="btn btn--primary btn--sm" type="button" onClick={save} disabled={gridDiff === 0 || saving}>
              {saving ? "저장 중…" : "권한 저장"}
            </button>
          </>
        ) : null}
      </div>

      {/* 편집 중에는 격자까지 스크롤을 내리게 된다. 본문 맨 위에 두면 정작 막힌 순간에 화면 밖이라
          스코프바 바로 아래에 붙여 둔다. */}
      {blocked && dirty ? (
        <div
          className="note note--warn"
          role="alert"
          style={{
            position: "sticky",
            top: "calc(var(--topbar-h) + var(--scopebar-h))",
            zIndex: 20,
            margin: "var(--s-4) var(--s-5) 0",
            background: "var(--surface-1)",
          }}
        >
          <Icon name="warn" size={16} />
          <div>
            <strong>저장하지 않은 변경 {gridDiff + (infoDirty ? 1 : 0)}건이 있습니다</strong>
            저장하거나 되돌린 뒤 다른 역할로 이동하세요.
            <div className="flex gap-2 mt-3">
              {gridDiff > 0 ? (
                <button className="btn btn--primary btn--sm" type="button" onClick={save} disabled={saving}>
                  권한 저장
                </button>
              ) : null}
              <button className="btn btn--secondary btn--sm" type="button" onClick={revert}>
                되돌리기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <main className="page">
        <div className="split--left grid" style={{ alignItems: "start" }}>
          <section className="panel">
            <div className="panel__head">
              <h3>역할</h3>
              <span className="badge">{roles.length}</span>
              {canWrite ? (
                <div className="right-slot">
                  <Link
                    className="btn btn--ghost btn--icon btn--sm"
                    href="/roles?new=1"
                    onNavigate={guard}
                    aria-label="역할 추가"
                    title="역할 추가"
                  >
                    <Icon name="plus" size={15} />
                  </Link>
                </div>
              ) : null}
            </div>
            <ul className="stack" style={dirty ? { opacity: 0.55 } : undefined}>
              {roles.map((item) => (
                <li
                  className={item.code === role?.code ? "is-selected" : undefined}
                  key={item.code}
                  aria-current={item.code === role?.code ? "true" : undefined}
                  style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}
                >
                  <Link className="cellstack" href={`/roles?code=${encodeURIComponent(item.code)}`} onNavigate={guard}>
                    <span className="primary flex gap-2">
                      {item.name}
                      {item.isSuper ? (
                        <span style={{ color: "var(--ink-tertiary)", display: "inline-flex" }}>
                          <Icon name="lock" size={13} />
                        </span>
                      ) : null}
                    </span>
                    <small>
                      {item.userCount}명 · {item.description || "설명 없음"}
                    </small>
                  </Link>
                  <span className="num t-xs dim">
                    {item.isSuper ? leaves.length : item.grantedMenuCount}/{leaves.length}
                  </span>
                </li>
              ))}
            </ul>
            <div className="panel__foot" style={{ display: "block" }}>
              <span className="t-xs dim">
                역할은 메뉴 트리를 기준으로 권한을 정합니다. 메뉴가 추가되면 슈퍼관리자 외에는 닫힌 채로 시작합니다.
              </span>
            </div>
          </section>

          {creating ? (
            <NewRolePanel />
          ) : !detail || !role ? (
            <section className="panel">
              <div className="empty">
                <span className="empty__mark">
                  <Icon name="shield" size={20} />
                </span>
                <h3>역할을 선택하세요</h3>
                <p>왼쪽 목록에서 역할을 고르면 역할 정보와 메뉴별 권한을 볼 수 있습니다.</p>
              </div>
            </section>
          ) : (
            <div className="col gap-4">
              <RoleInfoPanel
                role={role}
                members={detail.members}
                name={name}
                description={description}
                onName={setName}
                onDescription={setDescription}
                editable={editable}
                canWrite={canWrite}
              />

              <section className="panel">
                <div className="panel__head">
                  <h3>메뉴별 권한</h3>
                  <span className="t-xs dim">C 등록 · R 조회 · U 수정 · D 삭제</span>
                  <span className="badge badge--outline">
                    {role.isSuper ? leaves.length : grantedCount}/{leaves.length}
                  </span>
                  {editable ? (
                    <div className="right-slot">
                      <button className="btn btn--ghost btn--sm" type="button" onClick={keepReadOnly}>
                        조회 권한만 남기기
                      </button>
                      <button className="btn btn--ghost btn--sm" type="button" onClick={() => setGrid({})}>
                        전체 해제
                      </button>
                    </div>
                  ) : null}
                </div>

                {gridError ? (
                  <div className="panel__body" style={{ paddingBottom: 0 }}>
                    <div className="note note--risk" role="alert">
                      <Icon name="alert" size={16} />
                      <div>
                        <strong>권한을 저장하지 못했습니다</strong>
                        {gridError}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="tablewrap">
                  <table className="table table--matrix">
                    <thead>
                      <tr>
                        <th style={{ width: 200 }}>메뉴</th>
                        {ACTIONS.map((action) => (
                          <th className="center" key={action} style={{ width: 52 }}>
                            {action.toUpperCase()}
                          </th>
                        ))}
                        <th style={{ width: 150 }}>부여 근거</th>
                        <th>비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map((menu) => (
                        <MatrixRow
                          key={menu.code}
                          menu={menu}
                          cell={grid[menu.code] ?? EMPTY}
                          roleCode={role.code}
                          roles={roles}
                          isSuper={role.isSuper}
                          editable={editable}
                          onToggle={toggle}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="panel__foot" style={{ display: "block" }}>
                  <div className="note note--accent" style={{ border: 0, background: "none", padding: 0 }}>
                    <Icon name="branch" size={16} />
                    <div>
                      <strong>등록·수정·삭제 권한에는 조회 권한이 필요합니다</strong>
                      조회를 끄면 나머지도 함께 꺼집니다. 회색으로 막힌 칸은 그 메뉴가 쓰지 않는 동작이거나 다른 역할 전용
                      메뉴입니다. 저장하면 감사 로그에 변경 전후가 남습니다.
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function MatrixRow({
  menu,
  cell,
  roleCode,
  roles,
  isSuper,
  editable,
  onToggle,
}: {
  menu: Menu;
  cell: Cell;
  roleCode: string;
  roles: RoleSummary[];
  isSuper: boolean;
  editable: boolean;
  onToggle: (menu: Menu, action: (typeof ACTIONS)[number]) => void;
}) {
  const exclusive = menu.exclusiveRoleCode;
  const lockedOut = !!exclusive && exclusive !== roleCode;
  const uses = { c: menu.useCreate, r: menu.useRead, u: menu.useUpdate, d: menu.useDelete };
  const LABEL = { c: "등록", r: "조회", u: "수정", d: "삭제" } as const;

  return (
    <tr>
      <th>
        <span className={exclusive === roleCode ? "inherit" : undefined}>{menu.name}</span>
      </th>
      {ACTIONS.map((action) =>
        uses[action] ? (
          <td key={action}>
            <label className="check">
              <input
                type="checkbox"
                // 슈퍼관리자는 격자와 무관하게 전부 허용이라 켜 둔 채 잠근다.
                checked={isSuper || cell[action]}
                disabled={!editable || lockedOut || (action !== "r" && !cell.r)}
                onChange={() => onToggle(menu, action)}
                aria-label={`${menu.name} ${LABEL[action]}`}
              />
            </label>
          </td>
        ) : (
          <td className="dim center" key={action}>
            -
          </td>
        ),
      )}
      <td>
        {!exclusive ? (
          <span className="badge badge--outline">기본</span>
        ) : exclusive === roleCode ? (
          <span className="badge badge--accent">이 역할 전용</span>
        ) : (
          <span className="badge badge--risk">
            {roles.find((role) => role.code === exclusive)?.name ?? exclusive} 전용
          </span>
        )}
      </td>
      <td className="dim">{NOTES[menu.code] ?? "-"}</td>
    </tr>
  );
}

function RoleInfoPanel({
  role,
  members,
  name,
  description,
  onName,
  onDescription,
  editable,
  canWrite,
}: {
  role: RoleDetail["role"];
  members: RoleDetail["members"];
  name: string;
  description: string;
  onName: (value: string) => void;
  onDescription: (value: string) => void;
  editable: boolean;
  canWrite: boolean;
}) {
  const [infoState, saveInfo, savingInfo] = useActionState<FormState, FormData>(updateRole, {});
  const [deleteState, removeRole, deleting] = useActionState<FormState, FormData>(deleteRole, {});
  const [confirming, setConfirming] = useState(false);

  return (
    <section className="panel">
      <form action={saveInfo}>
        <input type="hidden" name="code" value={role.code} />
        <div className="panel__head">
          <h3>역할 정보</h3>
          <span className="t-xs dim mono">{role.code}</span>
          {editable ? (
            <div className="right-slot">
              <button className="btn btn--secondary btn--sm" type="submit" disabled={savingInfo}>
                {savingInfo ? "저장 중…" : "정보 저장"}
              </button>
            </div>
          ) : null}
        </div>
        <div className="panel__body">
          {role.isSuper ? (
            <div className="note mb-4">
              <Icon name="lock" size={16} />
              <div>
                <strong>슈퍼관리자 역할은 바꿀 수 없습니다</strong>
                모든 메뉴에 항상 전부 허용이며, 이름·설명·권한·삭제가 모두 막혀 있습니다.
              </div>
            </div>
          ) : null}

          <div className="formgrid">
            <div className="field">
              <label htmlFor="r-name">
                역할명 {editable ? <span className="req">*</span> : null}
              </label>
              <input
                className="input"
                id="r-name"
                name="name"
                type="text"
                value={name}
                onChange={(event) => onName(event.target.value)}
                readOnly={!editable}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="r-code">역할 코드</label>
              <input className="input mono" id="r-code" type="text" value={role.code} readOnly />
              <span className="hint">코드는 만들 때 정해지고 바뀌지 않습니다.</span>
            </div>
            <div className="field span-2">
              <label htmlFor="r-desc">설명</label>
              <textarea
                className="textarea"
                id="r-desc"
                name="description"
                style={{ minHeight: 56 }}
                value={description}
                onChange={(event) => onDescription(event.target.value)}
                readOnly={!editable}
              />
            </div>
            <div className="field span-2">
              <label>
                소속 사용자 <span className="dim">{members.length}명</span>
              </label>
              {members.length === 0 ? (
                <span className="hint">아직 이 역할을 쓰는 사용자가 없습니다.</span>
              ) : (
                <ul className="stack" style={{ border: "1px solid var(--hairline)", borderRadius: "var(--r-md)" }}>
                  {members.map((member) => (
                    <li key={member.id} style={{ gridTemplateColumns: "22px minmax(0, 1fr) auto", padding: "7px 10px" }}>
                      <Avatar id={member.id} name={member.name} updatedAt={member.avatarUpdatedAt} size="sm" />
                      <span className="t-sm">
                        {member.name} <span className="dim">{member.department ?? "부서 없음"}</span>
                      </span>
                      {member.status === "ACTIVE" ? (
                        <span className="flex gap-2 t-xs muted">
                          <i className="dot dot--live" />
                          활성
                        </span>
                      ) : (
                        <span className="badge badge--outline">{STATUS_LABEL[member.status]}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <span className="hint">
                사용자에게 역할을 붙이거나 떼는 일은 <Link href="/users">사용자 관리</Link>에서 합니다.
              </span>
            </div>
          </div>

          {infoState.error ? (
            <span className="err mt-3" role="alert">
              <Icon name="alert" size={13} />
              {infoState.error}
            </span>
          ) : null}
        </div>
      </form>

      {canWrite && !role.isSuper ? (
        <div className="panel__foot">
          {deleteState.error ? (
            <span className="err" role="alert">
              <Icon name="alert" size={13} />
              {deleteState.error}
            </span>
          ) : null}
          <span className="grow" />
          {confirming ? (
            <form action={removeRole} className="flex gap-2">
              <input type="hidden" name="code" value={role.code} />
              <span className="t-sm">{role.name} 역할을 삭제할까요?</span>
              <button className="btn btn--ghost btn--sm" type="button" onClick={() => setConfirming(false)}>
                취소
              </button>
              <button className="btn btn--risk btn--sm" type="submit" disabled={deleting}>
                {deleting ? "삭제 중…" : "삭제"}
              </button>
            </form>
          ) : (
            <button className="btn btn--risk btn--sm" type="button" onClick={() => setConfirming(true)}>
              역할 삭제
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}

function NewRolePanel() {
  const [state, submit, pending] = useActionState<FormState, FormData>(createRole, {});

  return (
    <section className="panel">
      <form action={submit}>
        <div className="panel__head">
          <h3>새 역할</h3>
          <span className="t-xs dim">만든 직후에는 권한이 하나도 없습니다</span>
        </div>
        <div className="panel__body">
          <div className="formgrid">
            <div className="field">
              <label htmlFor="n-name">
                역할명 <span className="req">*</span>
              </label>
              <input className="input" id="n-name" name="name" type="text" required autoFocus />
            </div>
            <div className="field">
              <label htmlFor="n-code">
                역할 코드 <span className="req">*</span>
              </label>
              <input
                className="input mono"
                id="n-code"
                name="code"
                type="text"
                placeholder="OPS_ADMIN"
                pattern="[A-Za-z][A-Za-z0-9_]{1,39}"
                spellCheck={false}
                required
              />
              <span className="hint">대문자·숫자·밑줄로 2~40자. 나중에 바꿀 수 없습니다.</span>
            </div>
            <div className="field span-2">
              <label htmlFor="n-desc">설명</label>
              <textarea className="textarea" id="n-desc" name="description" style={{ minHeight: 56 }} />
            </div>
          </div>
          {state.error ? (
            <span className="err mt-3" role="alert">
              <Icon name="alert" size={13} />
              {state.error}
            </span>
          ) : null}
        </div>
        <div className="panel__foot">
          <span className="t-xs dim">만든 뒤 메뉴별 권한 격자에서 권한을 줍니다.</span>
          <span className="grow" />
          <Link className="btn btn--ghost btn--sm" href="/roles">
            취소
          </Link>
          <button className="btn btn--primary btn--sm" type="submit" disabled={pending}>
            {pending ? "만드는 중…" : "역할 만들기"}
          </button>
        </div>
      </form>
    </section>
  );
}
