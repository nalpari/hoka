"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { messageFor, mutate, type Menu } from "@/lib/bo";

export type FormState = { error?: string };

// 그룹이면 경로·아이콘·동작·전용 역할을 보내지 않는다. 서버도 같은 규칙으로 한 번 더 비운다.
function readMenu(formData: FormData) {
  const parentCode = String(formData.get("parentCode") ?? "");
  const on = (name: string) => formData.get(name) === "on";
  return {
    parentCode: parentCode || null,
    name: String(formData.get("name") ?? "").trim(),
    path: String(formData.get("path") ?? "").trim() || null,
    icon: String(formData.get("icon") ?? "") || null,
    description: String(formData.get("description") ?? "").trim() || null,
    visible: on("visible"),
    useCreate: on("useCreate"),
    useRead: on("useRead"),
    useUpdate: on("useUpdate"),
    useDelete: on("useDelete"),
    exclusiveRoleCode: String(formData.get("exclusiveRoleCode") ?? "") || null,
  };
}

export async function createMenu(_previous: FormState, formData: FormData): Promise<FormState> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const body = readMenu(formData);

  if (!/^[A-Z][A-Z0-9_]{1,39}$/.test(code)) {
    return { error: "메뉴 코드는 대문자로 시작하고 대문자·숫자·밑줄로 2~40자여야 합니다." };
  }
  if (!body.name) {
    return { error: "메뉴명을 입력해 주세요." };
  }

  try {
    await mutate<Menu>("/api/menus", "POST", { code, ...body });
  } catch (error) {
    return { error: messageFor(error) };
  }
  revalidatePath("/menus");
  // redirect는 예외를 던져 흐름을 끊으므로 try 밖에서 부른다.
  redirect(`/menus?code=${encodeURIComponent(code)}`);
}

export async function updateMenu(_previous: FormState, formData: FormData): Promise<FormState> {
  const code = String(formData.get("code") ?? "");
  const body = readMenu(formData);

  if (!body.name) {
    return { error: "메뉴명을 입력해 주세요." };
  }

  try {
    await mutate<Menu>(`/api/menus/${encodeURIComponent(code)}`, "PUT", body);
  } catch (error) {
    return { error: messageFor(error) };
  }
  // 레일이 이름·아이콘·노출을 그대로 쓰므로 화면 전체를 다시 그린다.
  revalidatePath("/", "layout");
  return {};
}

export async function deleteMenu(_previous: FormState, formData: FormData): Promise<FormState> {
  const code = String(formData.get("code") ?? "");
  try {
    await mutate<void>(`/api/menus/${encodeURIComponent(code)}`, "DELETE");
  } catch (error) {
    return { error: messageFor(error) };
  }
  revalidatePath("/", "layout");
  redirect("/menus");
}

// 트리의 위/아래 버튼. 폼이 아니라 값을 그대로 받는다(roles의 savePermissions와 같다).
export async function moveMenu(code: string, direction: "up" | "down"): Promise<FormState> {
  try {
    await mutate<void>(`/api/menus/${encodeURIComponent(code)}/move`, "PUT", { direction });
  } catch (error) {
    return { error: messageFor(error) };
  }
  revalidatePath("/", "layout");
  return {};
}
