"use server";

import { revalidatePath } from "next/cache";
import { reconciliationEntryInput, recordReconciliationEntry } from "@erp/core/pilot";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function recordReconciliationAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.RECONCILIATION_MANAGE);

  const parsed = reconciliationEntryInput.safeParse({
    branchId: formData.get("branchId"),
    entryDate: formData.get("entryDate"),
    metric: formData.get("metric"),
    manualValue: formData.get("manualValue"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  await recordReconciliationEntry(tenantId, userId, parsed.data);
  revalidatePath("/pilot/reconciliation");
  return {};
}
