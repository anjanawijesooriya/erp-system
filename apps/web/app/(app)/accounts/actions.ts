"use server";

import { revalidatePath } from "next/cache";
import { createAccount, createAccountInput } from "@erp/core/accounting";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createAccountAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.ACCOUNT_MANAGE);

  const parsed = createAccountInput.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await createAccount(tenantId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create account" };
  }

  revalidatePath("/accounts");
  return {};
}
