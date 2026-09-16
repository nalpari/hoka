"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";

import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { LOGIN_RESULT_LABEL, STATUS_LABEL, type LoginHistory, type RoleSummary, type UserDetail } from "@/lib/bo-types";
import { browserOf, day, daysSince, stamp } from "@/lib/format";

import { avatarAction, inviteUser, updateUser, userAction, type Secret, type UserState } from "./actions";

// 사진은 고른 즉시 올라간다. 따로 저장 버튼을 두면 고르고 나서 아무 일도 없는 것처럼 보인다.
function AvatarButtons({ user }: { user: UserDetail }) {
  const [state, run, pending] = useActionState<UserState, FormData>(avatarAction, {});

  const send = (fill: (data: FormData) => void) => {
    const data = new FormData();
    data.set("id", String(user.id));
    data.set("name", user.name);
    fill(data);
    startTransition(() => run(data));
  };

  return (
    <div className="col gap-2 mt-3">
      <div className="flex gap-2">
        <label
          className="btn btn--secondary btn--sm"
          style={pending ? { opacity: 0.6, cursor: "default" } : undefined}
        >
          <Icon name="upload" size={14} />
          {pending ? "올리는 중…" : user.avatarUpdatedAt ? "사진 바꾸기" : "사진 올리기"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            disabled={pending}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              // 같은 파일을 다시 고를 수 있도록 비운다. file 참조는 이미 잡아 뒀다.
              event.currentTarget.value = "";
              if (file) {
                send((data) => data.set("file", file));
              }
            }}
          />
        </label>
        {user.avatarUpdatedAt ? (
          <button
            className="btn btn--ghost btn--sm"
            type="button"
            disabled={pending}
            onClick={() => send((data) => data.set("op", "remove"))}
          >
            사진 지우기
          </button>
        ) : null}
      </div>
      {state.error ? (
        <span className="t-xs" style={{ color: "var(--risk)" }} role="alert">
          {state.error}
        </span>
      ) : (
        <span className="t-xs dim">정사각으로 잘라 작게 줄여 저장합니다. 10MB까지 올릴 수 있습니다.</span>
      )}
    </div>
  );
}

function SecretNote({ secret }: { secret: Secret }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(secret.value);
      setCopied(true);
    } catch {
      // 클립보드가 막힌 환경에서는 입력칸을 직접 복사하면 된다.
      setCopied(false);
    }
  };

  return (
    <div className="note note--accent" role="status">
      <Icon name="key" size={16} />
      <div>
        <strong>{secret.title}</strong>
        <div className="flex gap-2 mt-2">
          <input
            className="input mono"
            readOnly
            // 초대 링크는 길다. 잘려 보이면 복사 버튼을 못 믿는다.
            style={{ flex: "1 1 auto", minWidth: 0 }}
            value={secret.value}
            aria-label={secret.label}
            onFocus={(event) => event.currentTarget.select()}
          />
          <button className="btn btn--secondary btn--sm" type="button" onClick={copy}>
            <Icon name={copied ? "check" : "copy"} size={14} />
            {copied ? "복사됨" : "복사"}
          </button>
        </div>
        <span className="hint" style={{ display: "block", marginTop: 6 }}>
          {secret.hint}
        </span>
      </div>
    </div>
  );
}

function Feedback({ state }: { state: UserState }) {
  if (state.secret) return <SecretNote secret={state.secret} />;
  if (state.error) {
    return (
      <div className="note note--risk" role="alert">
        <Icon name="alert" size={16} />
        <div>{state.error}</div>
      </div>
    );
  }
  if (state.done) {
    return (
      <div className="note" role="status">
        <Icon name="check" size={16} />
        <div>{state.done}</div>
      </div>
    );
  }
  return null;
}

export function UserDetailPanel({
  user,
  roles,
  departments,
  accessible,
  history,
  canWrite,
  isSelf,
  editing,
  backHref,
}: {
  user: UserDetail;
  roles: RoleSummary[];
  departments: string[];
  accessible: { name: string; readOnly: boolean }[];
  history: LoginHistory[];
  canWrite: boolean;
  isSelf: boolean;
  editing: boolean;
  backHref: string;
}) {
  const [state, run, pending] = useActionState<UserState, FormData>(userAction, {});
  const [confirming, setConfirming] = useState(false);
  const passwordAge = daysSince(user.passwordChangedAt);

  const hidden = (op: string) => (
    <>
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="id" value={user.id} />
      <input type="hidden" name="name" value={user.name} />
    </>
  );

  return (
    <section className="panel">
      <div className="panel__head">
        <h3>사용자 상세</h3>
        {canWrite ? (
          <div className="right-slot">
            <Link
              className="btn btn--ghost btn--icon btn--sm"
              href={editing ? backHref : `${backHref}&edit=1`}
              aria-label={editing ? "편집 취소" : "편집"}
              title={editing ? "편집 취소" : "편집"}
            >
              <Icon name={editing ? "x" : "edit"} size={15} />
            </Link>
          </div>
        ) : null}
      </div>

      <div className="panel__body">
        <div className="flex gap-3 flex--start">
          <Avatar id={user.id} name={user.name} updatedAt={user.avatarUpdatedAt} size="lg" />
          <div className="grow">
            <div className="t-h3">{user.name}</div>
            <div className="t-sm muted">{user.email}</div>
            <div className="flex gap-1 mt-2">
              <span className="badge">{user.roleName}</span>
              {user.status !== "ACTIVE" ? (
                <span className={`badge ${user.status === "LOCKED" ? "badge--risk" : "badge--outline"}`}>
                  {STATUS_LABEL[user.status]}
                </span>
              ) : null}
            </div>
            {canWrite || isSelf ? <AvatarButtons user={user} /> : null}
          </div>
        </div>

        {state.secret || state.error || state.done ? (
          <div className="mt-4">
            <Feedback state={state} />
          </div>
        ) : null}

        {user.status === "LOCKED" ? (
          <div className="note note--risk mt-4">
            <Icon name="lock" size={16} />
            <div>
              <strong>
                {stamp(user.lockedAt) ?? "시각 미상"}{" "}
                {user.lockReason === "DORMANT" ? "90일 미접속으로 잠겼습니다" : "비밀번호 5회 오류로 잠겼습니다"}
              </strong>
              풀면 임시 비밀번호가 화면에 한 번 뜹니다. 본인에게 전달하면 첫 로그인 때 새 비밀번호를 정합니다.
              {canWrite ? (
                <form action={run} className="flex gap-2 mt-3">
                  {hidden("unlock")}
                  <button className="btn btn--primary btn--sm" type="submit" disabled={pending}>
                    {pending ? "처리 중…" : "잠금 해제"}
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        ) : null}

        {user.status === "INVITED" ? (
          <div className="note note--accent mt-4">
            <Icon name="mail" size={16} />
            <div>
              <strong>아직 초대를 수락하지 않았습니다</strong>
              초대 링크를 잃어버렸다면 새로 만들 수 있습니다. 이전 링크는 그 순간 무효가 됩니다.
              {canWrite ? (
                <form action={run} className="flex gap-2 mt-3">
                  {hidden("reinvite")}
                  <button className="btn btn--secondary btn--sm" type="submit" disabled={pending}>
                    {pending ? "처리 중…" : "초대 링크 다시 만들기"}
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {editing && canWrite ? (
        <EditForm user={user} roles={roles} departments={departments} backHref={backHref} />
      ) : (
        <div className="panel__body" style={{ borderTop: "1px solid var(--hairline)" }}>
          <dl className="deflist">
            <dt>부서</dt>
            <dd>{user.department ?? <span className="dim">없음</span>}</dd>
            <dt>역할</dt>
            <dd>
              <Link href={`/roles?code=${encodeURIComponent(user.roleCode)}`}>{user.roleName}</Link>
            </dd>
            <dt>데이터 범위</dt>
            {/* 데이터 범위는 아직 저장할 곳이 없어 고정 표기다. */}
            <dd>
              브랜드스토어 전체 <span className="dim">· 범위 설정 준비 중</span>
            </dd>
            <dt>계정 생성</dt>
            <dd>
              {day(user.createdAt) ?? "-"}
              {user.invitedByName ? <span className="dim"> · {user.invitedByName} 초대</span> : null}
            </dd>
            <dt>최근 로그인</dt>
            <dd>{stamp(user.lastLoginAt) ?? <span className="dim">기록 없음</span>}</dd>
            <dt>비밀번호 변경</dt>
            <dd>
              {day(user.passwordChangedAt) ?? <span className="dim">아직 없음</span>}
              {passwordAge !== null ? <span className="dim"> · {passwordAge}일 경과</span> : null}
              {user.passwordChangeRequired ? <span className="badge badge--warn"> 변경 필요</span> : null}
            </dd>
          </dl>
        </div>
      )}

      <div className="panel__body" style={{ borderTop: "1px solid var(--hairline)" }}>
        <div className="sechead">
          <h2>접근 가능한 메뉴</h2>
          <span className="t-xs dim">{user.roleName} 역할 기준</span>
        </div>
        {accessible.length === 0 ? (
          <span className="t-sm dim">이 역할에는 아직 열린 메뉴가 없습니다.</span>
        ) : (
          <div className="flex gap-1 flex--wrap">
            {accessible.map((menu) => (
              <span className="badge badge--outline" key={menu.name}>
                {menu.name}
                {menu.readOnly ? <span className="dim"> 조회</span> : null}
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        className="panel__body"
        style={{ borderTop: "1px solid var(--hairline)", paddingBottom: "var(--s-2)" }}
      >
        <div className="sechead">
          <h2>최근 로그인</h2>
          <span className="t-xs dim">최근 {history.length}건</span>
        </div>
      </div>
      {history.length === 0 ? (
        <div className="panel__body" style={{ paddingTop: 0 }}>
          <span className="t-sm dim">로그인 기록이 없습니다.</span>
        </div>
      ) : (
        <ul className="stack" style={{ marginTop: "calc(var(--s-2) * -1)" }}>
          {history.map((entry) => (
            <li key={entry.id} style={{ gridTemplateColumns: "minmax(0, 1fr) auto", padding: "8px var(--s-4)" }}>
              <span className="cellstack">
                <span className="primary" style={entry.result !== "SUCCESS" ? { color: "var(--risk)" } : undefined}>
                  {entry.result === "SUCCESS" ? "로그인" : entry.result === "LOCKED" ? "로그인 실패 · 계정 잠김" : "로그인 실패"}
                </span>
                <small>
                  {stamp(entry.createdAt)} · {browserOf(entry.userAgent)}
                  {entry.ip ? ` · ${entry.ip}` : ""}
                </small>
              </span>
              <span className={`badge ${entry.result === "SUCCESS" ? "badge--ok" : "badge--risk"}`}>
                {LOGIN_RESULT_LABEL[entry.result]}
              </span>
            </li>
          ))}
        </ul>
      )}

      {canWrite ? (
        <div className="panel__foot">
          {user.status !== "INVITED" ? (
            <form action={run}>
              {hidden("reset")}
              <button className="btn btn--secondary btn--sm" type="submit" disabled={pending}>
                <Icon name="key" size={14} />
                비밀번호 초기화
              </button>
            </form>
          ) : null}
          <span className="grow" />
          {user.status === "INACTIVE" ? (
            <span className="t-xs dim">이미 비활성 계정입니다</span>
          ) : confirming ? (
            <form action={run} className="flex gap-2">
              {hidden("deactivate")}
              <span className="t-sm">비활성화할까요?</span>
              <button className="btn btn--ghost btn--sm" type="button" onClick={() => setConfirming(false)}>
                취소
              </button>
              <button className="btn btn--risk btn--sm" type="submit" disabled={pending}>
                비활성화
              </button>
            </form>
          ) : (
            <button className="btn btn--risk btn--sm" type="button" onClick={() => setConfirming(true)}>
              계정 비활성화
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}

function EditForm({
  user,
  roles,
  departments,
  backHref,
}: {
  user: UserDetail;
  roles: RoleSummary[];
  departments: string[];
  backHref: string;
}) {
  const [state, submit, pending] = useActionState<UserState, FormData>(updateUser, {});

  return (
    <form action={submit} className="panel__body" style={{ borderTop: "1px solid var(--hairline)" }}>
      <input type="hidden" name="id" value={user.id} />
      <div className="formgrid">
        <div className="field span-2">
          <label htmlFor="u-name">
            이름 <span className="req">*</span>
          </label>
          <input className="input" id="u-name" name="name" type="text" defaultValue={user.name} required />
        </div>
        <div className="field">
          <label htmlFor="u-dept">부서</label>
          <input className="input" id="u-dept" name="department" list="departments" defaultValue={user.department ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="u-role">
            역할 <span className="req">*</span>
          </label>
          <select className="select" id="u-role" name="roleCode" defaultValue={user.roleCode} required>
            {roles.map((role) => (
              <option key={role.code} value={role.code}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <datalist id="departments">
        {departments.map((department) => (
          <option key={department} value={department} />
        ))}
      </datalist>
      {state.error ? (
        <span className="err mt-3" role="alert">
          <Icon name="alert" size={13} />
          {state.error}
        </span>
      ) : null}
      <div className="flex gap-2 mt-4">
        <button className="btn btn--primary btn--sm" type="submit" disabled={pending}>
          {pending ? "저장 중…" : "저장"}
        </button>
        <Link className="btn btn--ghost btn--sm" href={backHref}>
          취소
        </Link>
      </div>
    </form>
  );
}

export function InvitePanel({
  roles,
  departments,
  backHref,
}: {
  roles: RoleSummary[];
  departments: string[];
  backHref: string;
}) {
  const [state, submit, pending] = useActionState<UserState, FormData>(inviteUser, {});

  return (
    <section className="panel">
      <div className="panel__head">
        <h3>사용자 초대</h3>
        <div className="right-slot">
          <Link className="btn btn--ghost btn--icon btn--sm" href={backHref} aria-label="닫기" title="닫기">
            <Icon name="x" size={15} />
          </Link>
        </div>
      </div>

      {state.secret ? (
        <div className="panel__body">
          <SecretNote secret={state.secret} />
          <div className="flex gap-2 mt-4">
            <Link className="btn btn--secondary btn--sm" href={backHref}>
              목록으로
            </Link>
          </div>
        </div>
      ) : (
        <form action={submit}>
          <div className="panel__body">
            <div className="formgrid">
              <div className="field span-2">
                <label htmlFor="i-email">
                  이메일 <span className="req">*</span>
                </label>
                <input
                  className="input"
                  id="i-email"
                  name="email"
                  type="email"
                  spellCheck={false}
                  placeholder="name@hoka.co.kr"
                  required
                  autoFocus
                />
              </div>
              <div className="field">
                <label htmlFor="i-name">
                  이름 <span className="req">*</span>
                </label>
                <input className="input" id="i-name" name="name" type="text" required />
              </div>
              <div className="field">
                <label htmlFor="i-dept">부서</label>
                <input className="input" id="i-dept" name="department" list="departments" />
              </div>
              <div className="field span-2">
                <label htmlFor="i-role">
                  역할 <span className="req">*</span>
                </label>
                <select className="select" id="i-role" name="roleCode" required defaultValue="">
                  <option value="" disabled>
                    역할을 고르세요
                  </option>
                  {roles.map((role) => (
                    <option key={role.code} value={role.code}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <datalist id="departments">
              {departments.map((department) => (
                <option key={department} value={department} />
              ))}
            </datalist>
            {state.error ? (
              <span className="err mt-3" role="alert">
                <Icon name="alert" size={13} />
                {state.error}
              </span>
            ) : null}
          </div>
          <div className="panel__foot">
            <span className="t-xs dim">초대 링크가 화면에 뜹니다. 메일은 아직 나가지 않습니다.</span>
            <span className="grow" />
            <button className="btn btn--primary btn--sm" type="submit" disabled={pending}>
              {pending ? "초대 중…" : "초대하기"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
