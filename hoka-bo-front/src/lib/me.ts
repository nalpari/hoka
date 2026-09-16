import { redirect } from "next/navigation";

import { ApiError, callApi } from "@/lib/api";
import { readTokens } from "@/lib/session";

export type MenuAccess = {
  code: string;
  parentCode: string | null;
  name: string;
  path: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type Me = {
  id: number;
  email: string;
  name: string;
  department: string | null;
  roleCode: string;
  roleName: string;
  isSuper: boolean;
  passwordChangeRequired: boolean;
  menus: MenuAccess[];
};

// 보호 페이지가 공통으로 쓴다. proxy는 쿠키만 보므로 실제 검증은 여기서 한다.
export async function requireMe(): Promise<Me> {
  const { accessToken } = await readTokens();
  if (!accessToken) {
    redirect("/login");
  }
  try {
    return await callApi<Me>("/api/auth/me", { accessToken });
  } catch (error) {
    // 렌더 중에는 쿠키를 지울 수 없다. 쿠키를 지우는 Route Handler를 거쳐 로그인으로 보낸다.
    // 곧장 /login으로 보내면 proxy가 남은 access 쿠키를 보고 다시 대시보드로 돌려보내 왕복한다.
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      redirect("/session/clear");
    }
    throw error;
  }
}
