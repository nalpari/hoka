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
    // 쿠키 정리는 렌더 중에 못 한다. proxy와 로그아웃이 맡는다.
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      redirect("/login");
    }
    throw error;
  }
}
