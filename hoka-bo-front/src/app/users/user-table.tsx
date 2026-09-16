"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { LOGIN_RESULT_LABEL, STATUS_LABEL, type RoleSummary, type UserRow, type UserStatus } from "@/lib/bo-types";
import { stamp } from "@/lib/format";

import { bulkAction, type UserState } from "./actions";

function StatusCell({ status }: { status: UserStatus }) {
  if (status === "ACTIVE") {
    return (
      <span className="flex gap-2">
        <i className="dot dot--live" />
        활성
      </span>
    );
  }
  const tone = status === "LOCKED" ? "badge--risk" : status === "INVITED" ? "badge--accent" : "badge--outline";
  return <span className={`badge ${tone}`}>{STATUS_LABEL[status]}</span>;
}

export function UserTable({
  items,
  total,
  page,
  size,
  roles,
  selectedId,
  canWrite,
  filterQuery,
}: {
  items: UserRow[];
  total: number;
  page: number;
  size: number;
  roles: RoleSummary[];
  selectedId?: number;
  canWrite: boolean;
  filterQuery: string;
}) {
  const [picked, setPicked] = useState<number[]>([]);
  const [state, submit, pending] = useActionState<UserState, FormData>(bulkAction, {});

  const chosen = picked.filter((id) => items.some((item) => item.id === id));
  const allOn = items.length > 0 && chosen.length === items.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const join = filterQuery ? `${filterQuery}&` : "";
  const href = (next: number) => `/users?${join}page=${next}`;

  const toggle = (id: number) =>
    setPicked((was) => (was.includes(id) ? was.filter((value) => value !== id) : [...was, id]));

  if (items.length === 0) {
    return (
      <div className="empty">
        <span className="empty__mark">
          <Icon name="search" size={20} />
        </span>
        <h3>조건에 맞는 사용자가 없습니다</h3>
        <p>검색어를 지우거나 상태·역할·부서 조건을 넓혀 보세요.</p>
      </div>
    );
  }

  return (
    <>
      <div className="tablewrap">
        <table className="table">
          <thead>
            <tr>
              {/* 벌크 작업은 슈퍼관리자만 할 수 있다. 아무 일도 못 하는 선택칸을 두지 않는다. */}
              {canWrite ? (
                <th style={{ width: 36 }}>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={allOn}
                      ref={(node) => {
                        if (node) node.indeterminate = chosen.length > 0 && !allOn;
                      }}
                      onChange={() => setPicked(allOn ? [] : items.map((item) => item.id))}
                      aria-label="전체 선택"
                    />
                  </label>
                </th>
              ) : null}
              {/* 2단계 인증 열을 뺀 뒤로 고정 폭이 남은 칸에 비해 과했다. 좁은 화면에서
                  가로 스크롤이 생기지 않도록 폭은 브라우저 자동 배분에 맡긴다. */}
              <th>사용자</th>
              <th>부서</th>
              <th>역할</th>
              <th>상태</th>
              <th>최근 접속</th>
            </tr>
          </thead>
          <tbody>
            {items.map((user) => {
              const classes = [
                user.id === selectedId ? "is-selected" : "",
                user.status === "LOCKED" ? "is-risk" : "",
                user.status === "INACTIVE" ? "is-muted" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <tr className={classes || undefined} key={user.id} aria-current={user.id === selectedId ? "true" : undefined}>
                  {canWrite ? (
                    <td>
                      <label className="check rowcheck">
                        <input
                          type="checkbox"
                          checked={chosen.includes(user.id)}
                          onChange={() => toggle(user.id)}
                          aria-label={`${user.name} 선택`}
                        />
                      </label>
                    </td>
                  ) : null}
                  <td>
                    <div className="cellmedia">
                      <Avatar id={user.id} name={user.name} updatedAt={user.avatarUpdatedAt} />
                      <div className="cellstack">
                        <Link className="primary" href={`/users?${join}page=${page}&id=${user.id}`}>
                          {user.name}
                        </Link>
                        <small>{user.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>{user.department ?? <span className="dim">-</span>}</td>
                  <td>
                    <span className={`badge ${user.status === "INACTIVE" ? "badge--outline" : ""}`}>{user.roleName}</span>
                  </td>
                  <td>
                    <StatusCell status={user.status} />
                  </td>
                  <td className="num">
                    {user.lastAttemptAt ? (
                      <>
                        {stamp(user.lastAttemptAt)}
                        {user.lastAttemptResult && user.lastAttemptResult !== "SUCCESS" ? (
                          <span className="dim"> {LOGIN_RESULT_LABEL[user.lastAttemptResult]}</span>
                        ) : null}
                      </>
                    ) : (
                      <span className="dim">기록 없음</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {state.error ? (
        <div className="panel__body" style={{ paddingTop: 0 }}>
          <span className="err" role="alert">
            <Icon name="alert" size={13} />
            {state.error}
          </span>
        </div>
      ) : null}
      {state.done ? (
        <div className="panel__body" style={{ paddingTop: 0 }}>
          <span className="t-sm muted" role="status">
            {state.done}
          </span>
        </div>
      ) : null}

      <form className="pager" action={submit}>
        {chosen.map((id) => (
          <input type="hidden" name="ids" value={id} key={id} />
        ))}
        {canWrite ? <span>{chosen.length}명 선택</span> : null}
        {canWrite && chosen.length > 0 ? (
          <>
            {/* 기본값을 비워 둔다. 첫 역할이 슈퍼관리자라 무심코 누르면 일괄 승격이 된다. */}
            <select
              className="select"
              name="roleCode"
              defaultValue=""
              style={{ width: 130, minHeight: 26 }}
              aria-label="바꿀 역할"
            >
              <option value="" disabled>
                역할 선택
              </option>
              {roles.map((role) => (
                <option key={role.code} value={role.code}>
                  {role.name}
                </option>
              ))}
            </select>
            <button className="btn btn--ghost btn--sm" type="submit" name="op" value="role" disabled={pending}>
              역할 변경
            </button>
            <button className="btn btn--ghost btn--sm" type="submit" name="op" value="deactivate" disabled={pending}>
              비활성화
            </button>
          </>
        ) : null}
        <span className="grow" />
        <span>
          {total}명 중 {page * size + 1} ~ {Math.min(total, (page + 1) * size)}
        </span>
        <div className="pagenums">
          {Array.from({ length: pages }, (_, index) => (
            <Link href={href(index)} key={index} aria-current={index === page ? "page" : undefined}>
              {index + 1}
            </Link>
          ))}
        </div>
      </form>
    </>
  );
}
