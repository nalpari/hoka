// 백오피스 역할·사용자·메뉴 조회. Next 서버에서만 부른다(lib/api.ts와 같은 규칙).
import { ApiError, callApi } from "@/lib/api";
import { readTokens } from "@/lib/session";

import { PAGE_SIZE } from "@/lib/bo-types";
import type {
  LoginHistory,
  Menu,
  RoleDetail,
  RoleSummary,
  UserDetail,
  UserPage,
} from "@/lib/bo-types";

export * from "@/lib/bo-types";

async function authed<T>(path: string, init?: { method?: string; body?: unknown }) {
  const { accessToken } = await readTokens();
  return callApi<T>(path, { ...init, accessToken });
}

export const listRoles = () => authed<RoleSummary[]>("/api/roles");
export const getRole = (code: string) => authed<RoleDetail>(`/api/roles/${encodeURIComponent(code)}`);
export const listMenus = () => authed<Menu[]>("/api/menus");
export const listDepartments = () => authed<string[]>("/api/users/departments");
export const getUser = (id: number) => authed<UserDetail>(`/api/users/${id}`);
export const getLoginHistory = (id: number, limit = 5) =>
  authed<LoginHistory[]>(`/api/users/${id}/login-history?limit=${limit}`);

export type UserQuery = {
  q?: string;
  status?: string[];
  role?: string;
  department?: string;
  page?: number;
  size?: number;
};

export function listUsers(query: UserQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  // 상태는 복수 선택이라 같은 이름으로 여러 번 붙인다. Spring이 List<String>으로 받는다.
  query.status?.forEach((status) => params.append("status", status));
  if (query.role) params.set("role", query.role);
  if (query.department) params.set("department", query.department);
  params.set("page", String(query.page ?? 0));
  params.set("size", String(query.size ?? PAGE_SIZE));
  return authed<UserPage>(`/api/users?${params}`);
}


export const mutate = <T,>(path: string, method: string, body?: unknown) =>
  authed<T>(path, { method, body });

// API가 ProblemDetail의 code로 거절 이유를 알려 준다. 사람이 읽을 문장은 화면이 가진다.
const MESSAGES: Record<string, string> = {
  VALIDATION: "입력값을 확인해 주세요.",
  ROLE_CODE_DUPLICATE: "이미 있는 역할 코드입니다.",
  ROLE_NOT_FOUND: "없는 역할입니다.",
  ROLE_IN_USE: "소속 사용자가 있는 역할은 삭제할 수 없습니다. 사용자를 다른 역할로 옮긴 뒤 삭제하세요.",
  ROLE_EXCLUSIVE_MENU: "이 역할 전용 메뉴가 있어 삭제할 수 없습니다.",
  SUPER_ROLE_IMMUTABLE: "슈퍼관리자 역할은 바꿀 수 없습니다.",
  MENU_NOT_FOUND: "없는 메뉴가 포함됐습니다. 새로고침한 뒤 다시 저장해 주세요.",
  MENU_IS_GROUP: "메뉴 그룹에는 권한을 줄 수 없습니다.",
  MENU_CODE_DUPLICATE: "이미 있는 메뉴 코드입니다.",
  MENU_PATH_DUPLICATE: "다른 메뉴가 이미 쓰는 경로입니다.",
  MENU_PARENT_INVALID: "상위 메뉴를 다시 골라 주세요.",
  MENU_KIND_IMMUTABLE: "그룹과 메뉴는 서로 바꿀 수 없습니다. 새로 만든 뒤 옮기세요.",
  MENU_HAS_CHILDREN: "하위 메뉴가 있는 그룹은 삭제할 수 없습니다. 메뉴를 다른 그룹으로 옮기거나 먼저 지우세요.",
  MENU_IN_USE: "이 메뉴에 권한을 가진 역할이 있습니다. 권한 관리에서 먼저 뺀 뒤 삭제하세요.",
  MENU_SELF_DELETE: "메뉴 관리 자신은 삭제할 수 없습니다.",
  MENU_SELF_HIDDEN: "메뉴 관리 자신은 숨길 수 없습니다.",
  USE_READ_REQUIRED: "등록·수정·삭제를 쓰는 메뉴는 조회도 써야 합니다.",
  MENU_EXCLUSIVE: "다른 역할 전용 메뉴는 권한을 줄 수 없습니다.",
  ACTION_NOT_SUPPORTED: "그 메뉴가 쓰지 않는 동작입니다.",
  READ_REQUIRED: "등록·수정·삭제 권한에는 조회 권한이 필요합니다.",
  EMAIL_DUPLICATE: "이미 있는 이메일입니다.",
  USER_NOT_FOUND: "없는 사용자입니다.",
  LAST_SUPER_ADMIN: "마지막 슈퍼관리자는 비활성화하거나 역할을 바꿀 수 없습니다.",
  SELF_DEACTIVATION: "자기 계정은 비활성화할 수 없습니다.",
  SELF_ROLE_CHANGE: "자기 역할은 바꿀 수 없습니다.",
  NOT_LOCKED: "잠긴 계정이 아닙니다.",
  NOT_INVITED: "초대 대기 상태의 사용자만 다시 초대할 수 있습니다.",
  INVITE_INVALID: "만료되었거나 이미 사용한 초대 링크입니다.",
  PASSWORD_TOO_SHORT: "비밀번호가 너무 짧습니다.",
};

export function messageFor(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "처리 중 문제가 생겼습니다. 잠시 뒤 다시 시도해 주세요.";
  }
  if (error.status === 403) {
    return "이 작업은 슈퍼관리자만 할 수 있습니다.";
  }
  return MESSAGES[error.code] ?? error.detail ?? "처리 중 문제가 생겼습니다.";
}
