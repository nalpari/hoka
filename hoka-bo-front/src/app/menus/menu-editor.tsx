"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, useTransition } from "react";

import { Icon } from "@/components/Icon";
import { isIconName } from "@/components/icons";
import type { Menu, RoleSummary } from "@/lib/bo-types";

import { createMenu, deleteMenu, moveMenu, updateMenu, type FormState } from "./actions";

// 레일에 어울리는 것만 고른다. 전체 아이콘 세트에는 로그아웃·테마 같은 UI 전용 아이콘도 섞여 있다.
const MENU_ICONS = [
  "home", "truck", "undo", "message", "box", "ruler", "layers", "tag",
  "image", "users", "user", "star", "wallet", "receipt", "sitemap", "shield",
  "file", "smartphone", "chart", "sliders", "key", "lock", "calendar", "store",
] as const;

// "배송 추적을" / "클레임·반품을" 처럼 받침에 따라 조사를 고른다. 한글이 아니면 "을"로 둔다.
function objectParticle(name: string) {
  const last = name.charCodeAt(name.length - 1);
  if (last < 0xac00 || last > 0xd7a3) return "을";
  return (last - 0xac00) % 28 ? "을" : "를";
}

const ACTIONS = [
  { field: "useCreate", label: "등록", letter: "C" },
  { field: "useRead", label: "조회", letter: "R" },
  { field: "useUpdate", label: "수정", letter: "U" },
  { field: "useDelete", label: "삭제", letter: "D" },
] as const;

export function MenuEditor({
  menus,
  roles,
  selected,
  creating,
  defaultParent,
  canWrite,
}: {
  menus: Menu[];
  roles: RoleSummary[];
  selected: Menu | null;
  creating: "group" | "menu" | null;
  defaultParent?: string;
  canWrite: boolean;
}) {
  const groups = menus.filter((menu) => menu.parentCode === null);
  const childrenOf = (code: string) => menus.filter((menu) => menu.parentCode === code);

  const isGroup = creating ? creating === "group" : (selected?.parentCode ?? null) === null;
  const parentCode = creating ? (defaultParent ?? groups[0]?.code ?? "") : (selected?.parentCode ?? "");

  const [dirty, setDirty] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [icon, setIcon] = useState(selected?.icon ?? "");
  const [moving, startMoving] = useTransition();
  const [moveError, setMoveError] = useState<string>();

  // 거절당하지 않았을 때만 편집 중 표시를 내린다. 생성은 성공하면 redirect가 흐름을 끊는다.
  const [state, save, saving] = useActionState<FormState, FormData>(async (previous, formData) => {
    const result = await (creating ? createMenu : updateMenu)(previous, formData);
    if (!result.error) {
      setDirty(false);
    }
    return result;
  }, {});
  const [removeState, remove, removing] = useActionState<FormState, FormData>(deleteMenu, {});

  const guard = (event: { preventDefault: () => void }) => {
    if (dirty) {
      event.preventDefault();
      setBlocked(true);
    }
  };

  // 새 메뉴는 지금 보고 있는 그룹 안에 붙인다.
  const addTo = selected ? (selected.parentCode ?? selected.code) : (groups[0]?.code ?? "");
  const siblings = isGroup ? groups : childrenOf(parentCode);
  const at = selected ? siblings.findIndex((menu) => menu.code === selected.code) : -1;

  const move = (direction: "up" | "down") => {
    if (!selected) return;
    startMoving(async () => {
      const result = await moveMenu(selected.code, direction);
      setMoveError(result.error);
    });
  };

  const hiddenCount = menus.filter((menu) => menu.parentCode !== null && !menu.visible).length;
  const title = creating === "group" ? "새 그룹" : creating === "menu" ? "새 메뉴" : "메뉴 상세";

  return (
    <>
      <div className="scopebar">
        <span className="scopebar__lead">
          <Icon name="sitemap" size={14} />
          설정 주체
        </span>
        {/* 멀티 스토어가 없어 고정 표기다(권한 관리와 같다). */}
        <button className="scope is-set" type="button" aria-disabled="true" title="아직 한 개 스토어만 있습니다">
          <Icon name="store" size={14} />
          <b>호카코리아</b> 브랜드스토어
        </button>
        <span className="scope is-set">
          <Icon name="branch" size={14} />
          <b>{groups.length}</b> 그룹 · <b>{menus.length - groups.length}</b> 메뉴
        </span>
        {hiddenCount > 0 ? (
          <span className="scope">
            <Icon name="eyeoff" size={14} />
            숨긴 메뉴 {hiddenCount}
          </span>
        ) : null}
        <span className="scopebar__spacer" />
        {canWrite ? (
          <>
            <Link className="btn btn--ghost btn--sm" href="/menus?new=group" onClick={guard}>
              그룹 추가
            </Link>
            <Link
              className="btn btn--secondary btn--sm"
              href={`/menus?new=menu${addTo ? `&parent=${encodeURIComponent(addTo)}` : ""}`}
              onClick={guard}
            >
              <Icon name="plus" size={14} />
              메뉴 추가
            </Link>
          </>
        ) : null}
      </div>

      {blocked && dirty ? (
        <div className="note note--warn" role="alert" style={{ margin: "var(--s-4) var(--s-5) 0" }}>
          <Icon name="warn" size={16} />
          <div>
            저장하지 않은 변경이 있습니다. 저장하거나 되돌린 뒤에 다른 메뉴로 이동하세요.
            <span className="grow" />
          </div>
          <button className="btn btn--ghost btn--sm" type="button" onClick={() => setBlocked(false)}>
            계속 편집
          </button>
        </div>
      ) : null}

      <main className="page">
        <div className="split--left grid" style={{ alignItems: "start" }}>
          <section className="panel">
            <div className="panel__head">
              <h3>메뉴 트리</h3>
              <span className="badge">
                {groups.length} 그룹 · {menus.length - groups.length} 메뉴
              </span>
            </div>

            <div className="tree">
              {groups.map((group) => {
                const children = childrenOf(group.code);
                const groupSelected = selected?.code === group.code;
                return (
                  <div key={group.code}>
                    <div className="tree__group">
                      <Link
                        href={`/menus?code=${encodeURIComponent(group.code)}`}
                        onClick={guard}
                        aria-current={groupSelected ? "true" : undefined}
                        style={{ color: "inherit" }}
                      >
                        {group.name}
                      </Link>
                      <span className="count">{children.length}</span>
                      {groupSelected ? <span className="badge badge--accent">편집 중</span> : null}
                    </div>

                    {children.map((menu) => {
                      const current = selected?.code === menu.code;
                      const className = [
                        "treeitem",
                        current ? "is-selected" : "",
                        menu.visible ? "" : "is-hidden",
                      ]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <Link
                          className={className}
                          href={`/menus?code=${encodeURIComponent(menu.code)}`}
                          key={menu.code}
                          onClick={guard}
                          aria-current={current ? "true" : undefined}
                          style={{ gridTemplateColumns: "18px minmax(0, 1fr) auto" }}
                        >
                          <span className="treeitem__icon">
                            <Icon name={isIconName(menu.icon) ? menu.icon : "file"} size={16} />
                          </span>
                          <span className="treeitem__label">
                            <span>{menu.name}</span>
                            <span className="treeitem__path">{menu.path}</span>
                          </span>
                          <span className="treeitem__meta">
                            {menu.visible ? null : <Icon name="eyeoff" size={14} />}
                            {menu.exclusiveRoleCode ? <Icon name="lock" size={14} /> : null}
                          </span>
                        </Link>
                      );
                    })}

                    {children.length === 0 ? (
                      <div className="treeitem" style={{ gridTemplateColumns: "1fr", cursor: "default" }}>
                        <span className="t-xs dim">메뉴가 없습니다</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="panel__foot" style={{ display: "block" }}>
              <span className="t-xs dim">
                자물쇠는 전용 역할이 정해진 메뉴, 눈 감김은 레일에 숨긴 메뉴입니다. 순서는 메뉴를 고른 뒤
                상세에서 바꿉니다.
              </span>
            </div>
          </section>

          <div className="col gap-4">
            <section className="panel">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  startTransition(() => save(formData));
                }}
                onReset={() => {
                  setIcon(selected?.icon ?? "");
                  setDirty(false);
                }}
              >
                <div className="panel__head">
                  <h3>{title}</h3>
                  {selected && !creating ? (
                    <span className="badge badge--accent">
                      {selected.parentCode
                        ? `${groups.find((g) => g.code === selected.parentCode)?.name ?? selected.parentCode} · ${selected.name}`
                        : `그룹 · ${selected.name}`}
                    </span>
                  ) : null}
                  {dirty ? <span className="badge badge--warn">저장 전</span> : null}
                  {canWrite ? (
                    <div className="right-slot">
                      {creating ? (
                        <Link className="btn btn--ghost btn--sm" href="/menus">
                          취소
                        </Link>
                      ) : dirty ? (
                        <button className="btn btn--ghost btn--sm" type="reset">
                          되돌리기
                        </button>
                      ) : null}
                      <button className="btn btn--primary btn--sm" type="submit" disabled={saving || (!selected && !creating)}>
                        {saving ? "저장 중…" : "저장"}
                      </button>
                    </div>
                  ) : null}
                </div>

                {state.error ? (
                  <div className="note note--risk" role="alert" style={{ margin: "var(--s-4) var(--s-5) 0" }}>
                    <Icon name="alert" size={16} />
                    <div>{state.error}</div>
                  </div>
                ) : null}

                {!selected && !creating ? (
                  <div className="empty">
                    <span className="empty__mark">
                      <Icon name="sitemap" size={20} />
                    </span>
                    <h3>메뉴가 없습니다</h3>
                    <p>그룹을 먼저 만들고 그 안에 메뉴를 추가하세요.</p>
                  </div>
                ) : (
                  <fieldset
                    className="panel__body"
                    disabled={!canWrite}
                    style={{ paddingTop: 0, paddingBottom: 0, border: 0, margin: 0 }}
                    onChange={() => setDirty(true)}
                  >
                    {isGroup ? <input type="hidden" name="parentCode" value="" /> : null}
                    {creating ? null : <input type="hidden" name="code" value={selected?.code ?? ""} />}

                    <div className="formrow">
                      <div className="lbl">
                        {isGroup ? "그룹명" : "메뉴명"}
                        <small>
                          {isGroup ? "레일의 그룹 제목에 보입니다" : "레일과 화면 제목에 그대로 보입니다"}
                        </small>
                      </div>
                      <div className="formgrid">
                        <div className="field">
                          <label htmlFor="m-name">
                            이름 <span className="req">*</span>
                          </label>
                          <input
                            className="input"
                            id="m-name"
                            name="name"
                            type="text"
                            defaultValue={selected?.name ?? ""}
                            required
                            maxLength={40}
                          />
                        </div>
                        <div className="field">
                          <label htmlFor="m-code">{isGroup ? "그룹 코드" : "메뉴 코드"}</label>
                          <input
                            className="input mono"
                            id="m-code"
                            name={creating ? "code" : undefined}
                            type="text"
                            defaultValue={selected?.code ?? ""}
                            readOnly={!creating}
                            required={!!creating}
                            placeholder={creating ? (isGroup ? "SYS" : "SYS_JOBS") : undefined}
                            pattern={creating ? "[A-Za-z][A-Za-z0-9_]{1,39}" : undefined}
                          />
                          <span className="hint">
                            {creating
                              ? "권한·감사 로그가 이 코드로 참조합니다. 만든 뒤에는 바꿀 수 없습니다."
                              : `만들어진 ${isGroup ? "그룹" : "메뉴"}의 코드는 바꿀 수 없습니다.`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isGroup ? null : (
                      <div className="formrow">
                        <div className="lbl">경로와 상위 그룹</div>
                        <div className="formgrid">
                          <div className="field">
                            <label htmlFor="m-path">
                              경로 <span className="req">*</span>
                            </label>
                            <input
                              className="input mono"
                              id="m-path"
                              name="path"
                              type="text"
                              defaultValue={selected?.path ?? ""}
                              required
                              placeholder="/orders"
                              pattern={"/[a-z0-9][a-z0-9\\-\\/]*"}
                            />
                            <span className="hint">프론트 라우트와 같아야 합니다. 이미 쓰는 경로면 저장되지 않습니다.</span>
                          </div>
                          <div className="field">
                            <label htmlFor="m-parent">상위 그룹</label>
                            <select
                              className="select"
                              id="m-parent"
                              name="parentCode"
                              defaultValue={parentCode}
                              key={parentCode}
                            >
                              {groups.map((group) => (
                                <option key={group.code} value={group.code}>
                                  {group.name}
                                </option>
                              ))}
                            </select>
                            <span className="hint">그룹을 바꾸면 그 그룹의 맨 뒤로 갑니다.</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {isGroup ? null : (
                      <div className="formrow">
                        <div className="lbl">
                          아이콘<small>레일에 그려집니다</small>
                        </div>
                        <div className="field">
                          <input type="hidden" name="icon" value={icon} />
                          <div className="seg" role="group" aria-label="아이콘" style={{ flexWrap: "wrap" }}>
                            {MENU_ICONS.map((name) => (
                              <button
                                type="button"
                                key={name}
                                aria-pressed={icon === name}
                                aria-label={name}
                                title={name}
                                onClick={() => {
                                  setIcon(name);
                                  setDirty(true);
                                }}
                                style={{ padding: "0 8px" }}
                              >
                                <Icon name={name} size={15} />
                              </button>
                            ))}
                          </div>
                          <span className="hint">고르지 않으면 레일에 기본 문서 아이콘이 나옵니다.</span>
                        </div>
                      </div>
                    )}

                    <div className="formrow">
                      <div className="lbl">
                        노출과 순서<small>레일에 보일지와 같은 그룹 안 자리</small>
                      </div>
                      <div className="col gap-3">
                        <label className="check">
                          <input
                            className="switch"
                            type="checkbox"
                            name="visible"
                            defaultChecked={selected ? selected.visible : true}
                          />
                          레일에 표시
                          <span className="t-xs dim">끄면 권한이 있어도 레일에서 사라집니다</span>
                        </label>
                        {creating || !selected ? (
                          <span className="t-xs dim">새 항목은 {isGroup ? "트리" : "그룹"}의 맨 뒤에 붙습니다.</span>
                        ) : (
                          <div className="flex gap-3" style={{ alignItems: "center" }}>
                            <button
                              className="btn btn--secondary btn--icon btn--sm"
                              type="button"
                              onClick={() => move("up")}
                              disabled={!canWrite || moving || at <= 0}
                              aria-label="한 칸 위로"
                              title="한 칸 위로"
                            >
                              <Icon name="up" size={15} />
                            </button>
                            <button
                              className="btn btn--secondary btn--icon btn--sm"
                              type="button"
                              onClick={() => move("down")}
                              disabled={!canWrite || moving || at < 0 || at >= siblings.length - 1}
                              aria-label="한 칸 아래로"
                              title="한 칸 아래로"
                            >
                              <Icon name="down" size={15} />
                            </button>
                            <span className="t-xs dim">
                              {isGroup
                                ? `트리에서 ${at + 1}번째 그룹`
                                : `${groups.find((g) => g.code === parentCode)?.name ?? ""} 그룹 안에서 ${at + 1}번째`}
                              {siblings.length > 1 ? ` (전체 ${siblings.length})` : ""}
                            </span>
                          </div>
                        )}
                        {moveError ? (
                          <span className="t-xs" style={{ color: "var(--risk)" }}>
                            <Icon name="alert" size={13} />
                            {moveError}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {isGroup ? null : (
                      <div className="formrow">
                        <div className="lbl">
                          이 메뉴가 쓰는 동작
                          <small>여기서 켠 것만 권한 관리 격자에서 줄 수 있습니다</small>
                        </div>
                        <div>
                          <div className="grid grid--3" style={{ gap: "var(--s-2) var(--s-4)" }}>
                            {ACTIONS.map((action) => (
                              <label className="check" key={action.field}>
                                <input
                                  type="checkbox"
                                  name={action.field}
                                  defaultChecked={selected?.[action.field] ?? action.field === "useRead"}
                                />
                                {action.label} <span className="t-xs dim mono">{action.letter}</span>
                              </label>
                            ))}
                          </div>
                          <div className="field mt-4" style={{ maxWidth: 280 }}>
                            <label htmlFor="m-exclusive">전용 역할</label>
                            <select
                              className="select"
                              id="m-exclusive"
                              name="exclusiveRoleCode"
                              defaultValue={selected?.exclusiveRoleCode ?? ""}
                            >
                              <option value="">제한 없음</option>
                              {roles
                                .filter((role) => !role.isSuper)
                                .map((role) => (
                                  <option key={role.code} value={role.code}>
                                    {role.name}
                                  </option>
                                ))}
                              <option value="SUPER_ADMIN">슈퍼관리자 전용</option>
                            </select>
                            <span className="hint">정하면 그 역할과 슈퍼관리자만 이 메뉴 권한을 받습니다.</span>
                          </div>
                          <div className="note note--accent mt-4">
                            <Icon name="info" size={16} />
                            <div>
                              역할마다 어떤 동작을 줄지는 <Link href="/roles">권한 관리</Link>에서 정합니다. 이 화면은
                              메뉴가 그 동작을 쓰는지만 정합니다.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="formrow">
                      <div className="lbl">
                        설명<small>이 {isGroup ? "그룹이" : "메뉴가"} 무슨 일을 하는지 적어 둡니다</small>
                      </div>
                      <div className="field">
                        <textarea
                          className="textarea"
                          name="description"
                          aria-label="설명"
                          defaultValue={selected?.description ?? ""}
                          maxLength={500}
                        />
                      </div>
                    </div>
                  </fieldset>
                )}
              </form>

              {canWrite && selected && !creating ? (
                <div className="panel__foot">
                  {removeState.error ? (
                    <span className="t-xs" style={{ color: "var(--risk)" }}>
                      <Icon name="alert" size={13} />
                      {removeState.error}
                    </span>
                  ) : (
                    <span className="t-xs muted">
                      지운 {isGroup ? "그룹은" : "메뉴는"} 되돌릴 수 없습니다. 잠시 숨기려면 레일 표시를 끄세요.
                    </span>
                  )}
                  <span className="grow" />
                  {confirming ? (
                    <form action={remove} className="flex gap-2" style={{ alignItems: "center" }}>
                      <input type="hidden" name="code" value={selected.code} />
                      <span className="t-sm">
                        {selected.name}
                        {objectParticle(selected.name)} 삭제할까요?
                      </span>
                      <button
                        className="btn btn--ghost btn--sm"
                        type="button"
                        onClick={() => setConfirming(false)}
                      >
                        취소
                      </button>
                      <button className="btn btn--risk btn--sm" type="submit" disabled={removing}>
                        {removing ? "삭제 중…" : "삭제"}
                      </button>
                    </form>
                  ) : (
                    <button
                      className="btn btn--risk btn--sm"
                      type="button"
                      onClick={() => setConfirming(true)}
                    >
                      이 {isGroup ? "그룹" : "메뉴"} 삭제
                    </button>
                  )}
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
