import { cookies } from "next/headers";

// 토큰은 브라우저 JS가 읽지 못하도록 HttpOnly 쿠키에만 둔다.
export const ACCESS_COOKIE = "bo_at";
export const REFRESH_COOKIE = "bo_rt";
// refresh를 회전시킬 때 "로그인 유지"를 눌렀는지 알 수 없어서 따로 남긴다.
// 이게 없으면 갱신 한 번에 30일 로그인이 12시간으로 줄어든다.
export const REMEMBER_COOKIE = "bo_rm";

// 로그인 유지 여부에 따른 refresh 만료. API가 발급하는 만료와 같게 맞춘다.
export const REFRESH_MAX_AGE_REMEMBER = 60 * 60 * 24 * 30;
export const REFRESH_MAX_AGE_SESSION = 60 * 60 * 12;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  // 로컬은 http라 항상 secure를 켜면 쿠키가 저장되지 않는다.
  secure: process.env.NODE_ENV === "production",
} as const;

export type Tokens = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
};

export function refreshMaxAge(rememberMe: boolean) {
  return rememberMe ? REFRESH_MAX_AGE_REMEMBER : REFRESH_MAX_AGE_SESSION;
}

export async function readTokens() {
  const store = await cookies();
  return {
    accessToken: store.get(ACCESS_COOKIE)?.value,
    refreshToken: store.get(REFRESH_COOKIE)?.value,
    rememberMe: store.get(REMEMBER_COOKIE)?.value === "1",
  };
}

// 쿠키 쓰기는 Server Action·Route Handler·proxy에서만 된다. 페이지 렌더 중에는 호출하지 않는다.
export async function writeTokens(tokens: Tokens, rememberMe: boolean) {
  const store = await cookies();
  // access 쿠키가 사라진 것 자체가 만료 신호다. proxy가 그때 refresh로 갱신한다.
  store.set(ACCESS_COOKIE, tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: tokens.expiresInSeconds });
  store.set(REFRESH_COOKIE, tokens.refreshToken, { ...COOKIE_OPTIONS, maxAge: refreshMaxAge(rememberMe) });
  store.set(REMEMBER_COOKIE, rememberMe ? "1" : "0", {
    ...COOKIE_OPTIONS,
    maxAge: refreshMaxAge(rememberMe),
  });
}

export async function clearTokens() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
  store.delete(REMEMBER_COOKIE);
}
