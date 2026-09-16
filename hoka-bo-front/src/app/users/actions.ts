"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { messageFor, mutate, type Invitation, type TemporaryPassword, type UserDetail } from "@/lib/bo";

// 메일 발송이 없어 초대 링크·임시 비밀번호가 응답 본문으로만 온다. 화면이 받아서 보여 주고 전달은 사람이 한다.
export type Secret = { title: string; label: string; value: string; hint: string };
export type UserState = { error?: string; secret?: Secret; done?: string };

const PASSWORD_HINT = "본인에게 전달하세요. 첫 로그인 때 새 비밀번호를 정해야 합니다.";

export async function inviteUser(_previous: UserState, formData: FormData): Promise<UserState> {
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const roleCode = String(formData.get("roleCode") ?? "");

  if (!email.includes("@") || !name || !roleCode) {
    return { error: "이메일·이름·역할은 필수입니다." };
  }

  try {
    const invitation = await mutate<Invitation>("/api/users", "POST", {
      email,
      name,
      department: department || null,
      roleCode,
    });
    revalidatePath("/users");
    return {
      secret: {
        title: `${name}님을 초대했습니다`,
        label: "초대 링크",
        value: invitation.inviteUrl,
        hint: "메일 발송이 없어 이 링크를 직접 전달해야 합니다. 잃어버리면 상세에서 다시 초대할 수 있습니다.",
      },
    };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function updateUser(_previous: UserState, formData: FormData): Promise<UserState> {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const roleCode = String(formData.get("roleCode") ?? "");

  if (!name || !roleCode) {
    return { error: "이름과 역할은 필수입니다." };
  }

  try {
    await mutate<UserDetail>(`/api/users/${id}`, "PATCH", {
      name,
      department: department || null,
      roleCode,
    });
  } catch (error) {
    return { error: messageFor(error) };
  }
  revalidatePath("/users");
  // redirect는 예외를 던져 흐름을 끊으므로 try 밖에서 부른다.
  redirect(`/users?id=${id}`);
}

// 상세 패널의 버튼들. 결과(임시 비밀번호·초대 링크)를 한 자리에 모아 보여 주려고 한 액션으로 묶었다.
export async function userAction(_previous: UserState, formData: FormData): Promise<UserState> {
  const op = String(formData.get("op") ?? "");
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "");

  try {
    switch (op) {
      case "unlock": {
        const result = await mutate<TemporaryPassword>(`/api/users/${id}/unlock`, "POST");
        revalidatePath("/users");
        return {
          secret: {
            title: `${name}님의 잠금을 풀었습니다`,
            label: "임시 비밀번호",
            value: result.temporaryPassword,
            hint: PASSWORD_HINT,
          },
        };
      }
      case "reset": {
        const result = await mutate<TemporaryPassword>(`/api/users/${id}/password-reset`, "POST");
        revalidatePath("/users");
        return {
          secret: {
            title: `${name}님의 비밀번호를 초기화했습니다`,
            label: "임시 비밀번호",
            value: result.temporaryPassword,
            hint: PASSWORD_HINT,
          },
        };
      }
      case "reinvite": {
        const invitation = await mutate<Invitation>(`/api/users/${id}/invitation`, "POST");
        revalidatePath("/users");
        return {
          secret: {
            title: `${name}님에게 초대 링크를 다시 만들었습니다`,
            label: "초대 링크",
            value: invitation.inviteUrl,
            hint: "이전 링크는 더 이상 쓸 수 없습니다.",
          },
        };
      }
      case "deactivate": {
        await mutate<void>("/api/users/deactivate", "POST", { ids: [id] });
        revalidatePath("/users");
        return { done: `${name}님의 계정을 비활성화했습니다.` };
      }
      default:
        return { error: "알 수 없는 요청입니다." };
    }
  } catch (error) {
    return { error: messageFor(error) };
  }
}

// 서버가 10MB까지 받는다(application.yaml). 여기서 먼저 막아 올리다 실패하는 왕복을 없앤다.
const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

// 사진은 JSON이 아니라 multipart로 간다. 레일·목록·역할 화면이 모두 같은 값을 쓰므로 전체를 다시 그린다.
export async function avatarAction(_previous: UserState, formData: FormData): Promise<UserState> {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "");
  const remove = formData.get("op") === "remove";

  try {
    if (remove) {
      await mutate<void>(`/api/users/${id}/avatar`, "DELETE");
      revalidatePath("/", "layout");
      return { done: `${name}님의 사진을 지웠습니다.` };
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "사진 파일을 골라 주세요." };
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return { error: "사진은 10MB까지 올릴 수 있습니다." };
    }

    const upload = new FormData();
    upload.set("file", file);
    await mutate<void>(`/api/users/${id}/avatar`, "POST", upload);
    revalidatePath("/", "layout");
    return { done: `${name}님의 사진을 바꿨습니다.` };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

// 목록에서 여러 명을 골라 한 번에 처리한다.
export async function bulkAction(_previous: UserState, formData: FormData): Promise<UserState> {
  const op = String(formData.get("op") ?? "");
  const ids = formData.getAll("ids").map(Number).filter(Number.isInteger);
  if (ids.length === 0) {
    return { error: "대상 사용자를 선택해 주세요." };
  }

  try {
    if (op === "role") {
      const roleCode = String(formData.get("roleCode") ?? "");
      if (!roleCode) return { error: "바꿀 역할을 고르세요." };
      await mutate<void>("/api/users/role", "PATCH", { ids, roleCode });
      revalidatePath("/users");
      return { done: `${ids.length}명의 역할을 바꿨습니다.` };
    }
    if (op === "deactivate") {
      await mutate<void>("/api/users/deactivate", "POST", { ids });
      revalidatePath("/users");
      return { done: `${ids.length}명을 비활성화했습니다.` };
    }
    return { error: "알 수 없는 요청입니다." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}
