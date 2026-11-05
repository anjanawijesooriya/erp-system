"use server";

import { revalidatePath } from "next/cache";
import { completeReconciliation, reconciliationInput } from "@erp/core/accounting";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function completeReconciliationAction(
  _prevState: { error?: string; clearedBalance?: string; variance?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; clearedBalance?: string; variance?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.BANK_RECONCILIATION_MANAGE);

  const clearedLineIds = formData.getAll("clearedLineIds").map(String);

  const parsed = reconciliationInput.safeParse({
    bankAccountCode: formData.get("bankAccountCode") || "1010",
    statementDate: formData.get("statementDate"),
    statementBalance: formData.get("statementBalance"),
    clearedLineIds,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    const result = await completeReconciliation(tenantId, userId, parsed.data);
    revalidatePath("/accounting/bank-reconciliation");
    return { clearedBalance: result.clearedBalance.toFixed(2), variance: result.variance.toFixed(2) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to complete reconciliation" };
  }
}
