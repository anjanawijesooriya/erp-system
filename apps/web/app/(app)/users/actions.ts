"use server";

import { revalidatePath } from "next/cache";
import { inviteUser, inviteUserInput, deactivateUser, reactivateUser } from "@erp/core/tenants";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function inviteUserAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.USER_MANAGE);

  const parsed = inviteUserInput.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    roleId: formData.get("roleId"),
    branchId: formData.get("branchId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await inviteUser(tenantId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to invite user" };
  }

  revalidatePath("/users");
  return {};
}

export async function deactivateUserAction(targetUserId: string) {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.USER_MANAGE);
  await deactivateUser(tenantId, targetUserId);
  revalidatePath("/users");
}

export async function reactivateUserAction(targetUserId: string) {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.USER_MANAGE);
  await reactivateUser(tenantId, targetUserId);
  revalidatePath("/users");
}
