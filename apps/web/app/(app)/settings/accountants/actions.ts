"use server";

import { revalidatePath } from "next/cache";
import { inviteAccountantToTenant, unlinkAccountantFromTenant } from "@erp/core/accountant-portal";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { assertModule } from "@erp/core/plans";
import { requireSession } from "@/lib/session";

export async function inviteAccountantAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertModule(tenantId, "accountant_portal");
  await assertCan(userId, PERMISSIONS.TENANT_SETTINGS_MANAGE);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const canPostJournals = formData.get("canPostJournals") === "on";

  if (!name || !email || password.length < 8) {
    return { error: "Name, email, and an at-least-8-character password are required." };
  }

  await inviteAccountantToTenant(tenantId, name, email, password, canPostJournals);
  revalidatePath("/settings/accountants");
  return {};
}

export async function unlinkAccountantAction(accountantId: string) {
  const { tenantId, userId } = await requireSession();
  await assertModule(tenantId, "accountant_portal");
  await assertCan(userId, PERMISSIONS.TENANT_SETTINGS_MANAGE);
  await unlinkAccountantFromTenant(tenantId, accountantId);
  revalidatePath("/settings/accountants");
}
