import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_COOKIE,
  COOKIE_OPTIONS,
  REFRESH_COOKIE,
  REMEMBER_COOKIE,
  refreshMaxAge,
  type Tokens,
} from "@/lib/session";

// Next 16에서 middleware는 proxy로 이름이 바뀌었다.
// 여기서는 쿠키만 보고 판단한다(낙관적 검사). 진짜 검증은 페이지가 /api/auth/me로 한다.
const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const isPublic = PUBLIC_PATHS.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`),
  );
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (accessToken) {
    return isPublic ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }

  // access 쿠키가 사라진 것이 곧 만료 신호다. 쿠키를 쓸 수 있는 자리가 여기뿐이라 갱신도 여기서 한다.
  if (refreshToken) {
    const tokens = await renew(refreshToken);
    if (tokens) {
      return withRenewedTokens(request, tokens, isPublic);
    }
    return signedOut(request, isPublic);
  }

  return isPublic ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url));
}

async function renew(refreshToken: string) {
  const baseUrl = process.env.BO_API_BASE_URL;
  if (!baseUrl) return null;
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    return response.ok ? ((await response.json()) as Tokens) : null;
  } catch {
    // API가 떠 있지 않으면 갱신도 실패로 본다. 로그인 화면으로 보낸다.
    return null;
  }
}

function withRenewedTokens(request: NextRequest, tokens: Tokens, isPublic: boolean) {
  const rememberMe = request.cookies.get(REMEMBER_COOKIE)?.value === "1";

  // 응답 쿠키만 세우면 다음 요청부터 보인다. 이번 요청의 렌더에도 넘기려면 요청 헤더를 고쳐 보낸다.
  const jar = new Map(request.cookies.getAll().map((cookie) => [cookie.name, cookie.value]));
  jar.set(ACCESS_COOKIE, tokens.accessToken);
  jar.set(REFRESH_COOKIE, tokens.refreshToken);
  const headers = new Headers(request.headers);
  headers.set(
    "cookie",
    [...jar].map(([name, value]) => `${name}=${value}`).join("; "),
  );

  const response = isPublic
    ? NextResponse.redirect(new URL("/", request.url))
    : NextResponse.next({ request: { headers } });
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: tokens.expiresInSeconds,
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: refreshMaxAge(rememberMe),
  });
  return response;
}

function signedOut(request: NextRequest, isPublic: boolean) {
  const response = isPublic
    ? NextResponse.next()
    : NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  response.cookies.delete(REMEMBER_COOKIE);
  return response;
}

export const config = {
  // 정적 자산까지 매번 API를 부르지 않도록 제외한다.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:webp|png|jpg|jpeg|svg|ico|css|js)$).*)"],
};
