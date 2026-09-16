"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { messageFor, mutate, type MenuPermission, type Role } from "@/lib/bo";

export type FormState = { error?: string };

export async function createRole(_previous: FormState, formData: FormData): Promise<FormState> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!/^[A-Z][A-Z0-9_]{1,39}$/.test(code)) {
    return { error: "역할 코드는 대문자로 시작하고 대문자·숫자·밑줄로 2~40자여야 합니다." };
  }
  if (!name) {
    return { error: "역할명을 입력해 주세요." };
  }

  try {
    await mutate<Role>("/api/roles", "POST", { code, name, description: description || null });
  } catch (error) {
    return { error: messageFor(error) };
  }
  revalidatePath("/roles");
  // redirect는 예외를 던져 흐름을 끊으므로 try 밖에서 부른다.
  redirect(`/roles?code=${encodeURIComponent(code)}`);
}

export async function updateRole(_previous: FormState, formData: FormData): Promise<FormState> {
  const code = String(formData.get("code") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    return { error: "역할명을 입력해 주세요." };
  }

  try {
    await mutate<Role>(`/api/roles/${encodeURIComponent(code)}`, "PUT", {
      name,
      description: description || null,
    });
  } catch (error) {
    return { error: messageFor(error) };
  }
  revalidatePath("/roles");
  return {};
}

export async function deleteRole(_previous: FormState, formData: FormData): Promise<FormState> {
  const code = String(formData.get("code") ?? "");
  try {
    await mutate<void>(`/api/roles/${encodeURIComponent(code)}`, "DELETE");
  } catch (error) {
    return { error: messageFor(error) };
  }
  revalidatePath("/roles");
  redirect("/roles");
}

// 격자는 폼이 아니라 클라이언트 상태라 FormData 대신 값을 그대로 받는다.
export async function savePermissions(code: string, permissions: MenuPermission[]): Promise<FormState> {
  try {
    await mutate<MenuPermission[]>(`/api/roles/${encodeURIComponent(code)}/permissions`, "PUT", permissions);
  } catch (error) {
    return { error: messageFor(error) };
  }
  revalidatePath("/roles");
  return {};
}
