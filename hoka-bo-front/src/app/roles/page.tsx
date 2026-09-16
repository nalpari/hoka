import { Icon } from "@/components/Icon";
import { NoAccess, Shell } from "@/components/Shell";
import { getRole, listMenus, listRoles } from "@/lib/bo";
import { requireMe } from "@/lib/me";

import { RoleEditor } from "./role-editor";

// 시안 ref/design/roles.html 기준. 권한 위임(부여 근거·한도·만료)과 데이터 범위, 메뉴 트리 버전,
// 변경 이력·역할 복제는 API가 없어 시안 문구만 남기거나 뺐다.
export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const me = await requireMe();
  const title = (
    <>
      <span className="crumb">
        시스템 <Icon name="right" size={13} />
      </span>
      권한 관리
    </>
  );

  if (!me.menus.some((menu) => menu.code === "SYS_ROLES" && menu.canRead)) {
    return (
      <Shell me={me} activeMenuCode="SYS_ROLES" title={title}>
        <NoAccess what="권한 관리" />
      </Shell>
    );
  }

  const params = await searchParams;
  // 역할 생성·수정·삭제는 슈퍼관리자만 할 수 있다(API가 SUPER를 요구한다).
  const creating = params.new === "1" && me.isSuper;

  const [roles, menus] = await Promise.all([listRoles(), listMenus()]);
  const wanted = typeof params.code === "string" ? params.code : undefined;
  const selected = creating
    ? undefined
    : (roles.some((role) => role.code === wanted) ? wanted : roles[0]?.code);
  const detail = selected ? await getRole(selected) : null;

  return (
    <Shell me={me} activeMenuCode="SYS_ROLES" title={title}>
      {/* 역할이 바뀌면 격자의 편집 상태를 이어받지 않도록 통째로 다시 마운트한다. */}
      <RoleEditor
        key={creating ? "new" : (selected ?? "none")}
        roles={roles}
        menus={menus}
        detail={detail}
        canWrite={me.isSuper}
        creating={creating}
      />
    </Shell>
  );
}
