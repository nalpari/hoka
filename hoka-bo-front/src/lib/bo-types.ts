// 역할·사용자·메뉴의 모양과 상태 값. 서버·클라이언트 양쪽에서 쓰므로
// 여기에는 next/headers를 끌고 오는 코드를 두지 않는다(lib/bo.ts는 서버 전용이다).

export type Role = {
  code: string;
  name: string;
  description: string | null;
  isSuper: boolean;
};

export type RoleSummary = Role & {
  userCount: number;
  grantedMenuCount: number;
};

export type RoleMember = {
  id: number;
  name: string;
  department: string | null;
  status: UserStatus;
  avatarUpdatedAt: string | null;
};

export type MenuPermission = {
  menuCode: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type RoleDetail = {
  role: Role;
  members: RoleMember[];
  permissions: MenuPermission[];
};

// parentCode가 null이면 그룹이고 path도 icon도 null이다. use*는 그 메뉴가 실제로 쓰는 동작이라
// 격자에서 "-"로 막을 칸을 정한다. exclusiveRoleCode가 있으면 그 역할만 권한을 가질 수 있다.
export type Menu = {
  code: string;
  parentCode: string | null;
  name: string;
  path: string | null;
  icon: string | null;
  description: string | null;
  sortOrder: number;
  visible: boolean;
  useCreate: boolean;
  useRead: boolean;
  useUpdate: boolean;
  useDelete: boolean;
  exclusiveRoleCode: string | null;
};

export const USER_STATUSES = ["ACTIVE", "LOCKED", "INVITED", "INACTIVE"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "활성",
  LOCKED: "잠금",
  INVITED: "초대 대기",
  INACTIVE: "비활성",
};

// 로그인 이력의 결과. LOCKED는 그 시도로 계정이 잠긴 경우다(AuthService).
export type LoginResult = "SUCCESS" | "FAILED" | "LOCKED";

export const LOGIN_RESULT_LABEL: Record<LoginResult, string> = {
  SUCCESS: "성공",
  FAILED: "실패",
  LOCKED: "잠김",
};

export type UserRow = {
  id: number;
  email: string;
  name: string;
  department: string | null;
  roleCode: string;
  roleName: string;
  status: UserStatus;
  lastAttemptAt: string | null;
  lastAttemptResult: LoginResult | null;
  avatarUpdatedAt: string | null;
};

export type UserPage = {
  items: UserRow[];
  total: number;
  statusCounts: Partial<Record<UserStatus, number>>;
};

export type UserDetail = {
  id: number;
  email: string;
  name: string;
  department: string | null;
  roleCode: string;
  roleName: string;
  status: UserStatus;
  lockReason: "PASSWORD_FAILED" | "DORMANT" | null;
  lockedAt: string | null;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  passwordChangeRequired: boolean;
  createdAt: string | null;
  invitedByName: string | null;
  /** null이면 사진이 없어 이니셜로 그린다. 값이 바뀌면 브라우저 캐시도 바뀐다. */
  avatarUpdatedAt: string | null;
};

export type LoginHistory = {
  id: number;
  userId: number | null;
  email: string;
  result: LoginResult;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type Invitation = { userId: number; inviteUrl: string };
export type TemporaryPassword = { temporaryPassword: string };

export const PAGE_SIZE = 20;
