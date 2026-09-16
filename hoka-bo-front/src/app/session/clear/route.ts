import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE, REMEMBER_COOKIE } from "@/lib/session";

// API가 세션을 거절했는데 쿠키가 남아 있으면 proxy는 계속 대시보드로 돌려보내고
// 페이지는 계속 로그인으로 돌려보내 무한 왕복이 된다. 쿠키를 지울 수 있는 자리가
// Server Action·Route Handler·proxy뿐이라, 거절된 세션은 여기를 거쳐 로그인으로 간다.
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login?expired=1", request.url));
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  response.cookies.delete(REMEMBER_COOKIE);
  return response;
}
