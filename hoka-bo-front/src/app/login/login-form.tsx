"use client";

import { useActionState, useState } from "react";

import { Icon } from "@/components/Icon";

import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [revealed, setRevealed] = useState(false);

  return (
    <form className="col gap-4 mt-5" action={formAction}>
      <div className="field">
        <label htmlFor="email">사원 계정</label>
        {/* 실패해도 이메일은 남기고 비밀번호만 비운다. */}
        <input
          className="input input--lg"
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          spellCheck={false}
          defaultValue={state.email ?? ""}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="password">비밀번호</label>
        <div className="inputwrap">
          <input
            className="input input--lg"
            id="password"
            name="password"
            type={revealed ? "text" : "password"}
            autoComplete="current-password"
            style={{ paddingLeft: 12, paddingRight: 40 }}
            required
          />
          <button
            className="btn btn--ghost btn--icon btn--sm suffixbtn"
            type="button"
            onClick={() => setRevealed((on) => !on)}
            aria-label={revealed ? "비밀번호 숨기기" : "비밀번호 표시"}
            aria-pressed={revealed}
          >
            <Icon name={revealed ? "eyeoff" : "eye"} size={15} />
          </button>
        </div>
        {state.error ? (
          <span className="err" role="alert">
            <Icon name="alert" size={13} />
            {state.error}
          </span>
        ) : null}
      </div>

      <div className="flex flex--between">
        <label className="check">
          <input type="checkbox" name="rememberMe" defaultChecked /> 이 기기에서 로그인 유지
        </label>
      </div>

      <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={pending}>
        {pending ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}
