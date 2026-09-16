import { Icon } from "@/components/Icon";
import { NoAccess, Shell } from "@/components/Shell";
import { listMenus, listRoles } from "@/lib/bo";
import { requireMe } from "@/lib/me";

import { MenuEditor } from "./menu-editor";

// 시안 ref/design/menus.html 기준. 초안·배포 버전(v13)과 변경 이력은 API가 없어 뺐고,
// 손잡이 드래그는 같은 그룹 안 위/아래 버튼으로 옮겼다(키보드로도 순서를 바꿀 수 있다).
// 시안의 '접근 가능한 역할'은 권한 관리 격자와 같은 일이라, 이 화면은 메뉴가 쓰는 동작만 정한다.
export default async function MenusPage({
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
      메뉴 관리
    </>
  );

  if (!me.menus.some((menu) => menu.code === "SYS_MENUS" && menu.canRead)) {
    return (
      <Shell me={me} activeMenuCode="SYS_MENUS" title={title}>
        <NoAccess what="메뉴 관리" />
      </Shell>
    );
  }

  const params = await searchParams;
  // 메뉴 생성·수정·삭제는 슈퍼관리자만 할 수 있다(API가 SUPER를 요구한다).
  const creating = me.isSuper && (params.new === "group" || params.new === "menu") ? params.new : null;

  const menus = await listMenus();
  // 전용 역할은 슈퍼관리자만 고르므로, 역할 목록도 그때만 부른다(조회 권한이 SYS_ROLES:R이다).
  const roles = me.isSuper ? await listRoles() : [];

  const wanted = typeof params.code === "string" ? params.code : undefined;
  const selected = creating ? null : (menus.find((menu) => menu.code === wanted) ?? menus[0] ?? null);
  const parent = typeof params.parent === "string" ? params.parent : undefined;

  return (
    <Shell me={me} activeMenuCode="SYS_MENUS" title={title}>
      {/* 다른 메뉴로 옮기면 상세 폼의 편집 상태를 이어받지 않도록 통째로 다시 마운트한다. */}
      <MenuEditor
        key={creating ? `new-${creating}-${parent ?? ""}` : (selected?.code ?? "none")}
        menus={menus}
        roles={roles}
        selected={selected}
        creating={creating}
        defaultParent={parent}
        canWrite={me.isSuper}
      />
    </Shell>
  );
}
