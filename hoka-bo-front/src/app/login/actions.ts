"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError, callApi } from "@/lib/api";
import { clearTokens, readTokens, writeTokens, type Tokens } from "@/lib/session";

export type LoginState = {
  error?: string;
  /** 실패해도 이메일은 남기고 비밀번호만 비운다. */
  email?: string;
};

const MESSAGES = {
  VALIDATION: "이메일과 비밀번호를 입력해 주세요.",
  INVALID_CREDENTIALS: "비밀번호가 맞지 않습니다. 5회 틀리면 계정이 잠기고 권한 관리자가 풀어야 합니다.",
  LOCKED_PASSWORD: "비밀번호를 5회 틀려 잠긴 계정입니다. 권한 관리자에게 잠금 해제를 요청하세요.",
  LOCKED_DORMANT: "90일 동안 접속하지 않아 잠긴 계정입니다. 권한 관리자에게 잠금 해제를 요청하세요.",
  UNKNOWN: "로그인 중 문제가 생겼습니다. 잠시 뒤 다시 시도해 주세요.",
};

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("rememberMe") === "on";

  if (!email || !password) {
    return { error: MESSAGES.VALIDATION, email };
  }

  const incoming = await headers();
  try {
    const tokens = await callApi<Tokens>("/api/auth/login", {
      method: "POST",
      body: { email, password, rememberMe },
      clientIp: clientIp(incoming.get("x-forwarded-for")),
      userAgent: incoming.get("user-agent") ?? undefined,
    });
    await writeTokens(tokens, rememberMe);
  } catch (error) {
    return { error: messageFor(error), email };
  }
  // redirect는 예외를 던져 흐름을 끊으므로 try 밖에서 부른다.
  redirect("/");
}

export async function logout() {
  const { refreshToken } = await readTokens();
  if (refreshToken) {
    try {
      await callApi("/api/auth/logout", { method: "POST", body: { refreshToken } });
    } catch {
      // 서버에서 지우지 못해도 이 브라우저의 쿠키는 지운다. 남은 토큰은 만료로 사라진다.
    }
  }
  await clearTokens();
  redirect("/login");
}

function messageFor(error: unknown) {
  if (!(error instanceof ApiError)) return MESSAGES.UNKNOWN;
  if (error.code === "ACCOUNT_LOCKED") {
    return error.lockReason === "DORMANT" ? MESSAGES.LOCKED_DORMANT : MESSAGES.LOCKED_PASSWORD;
  }
  if (error.code === "INVALID_CREDENTIALS") return MESSAGES.INVALID_CREDENTIALS;
  if (error.code === "VALIDATION") return MESSAGES.VALIDATION;
  return MESSAGES.UNKNOWN;
}

// X-Forwarded-For는 쉼표로 이어진다. 맨 앞이 실제 클라이언트다.
function clientIp(forwardedFor: string | null) {
  return forwardedFor?.split(",")[0]?.trim() || undefined;
}
