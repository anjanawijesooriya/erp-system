"use server";

import { revalidatePath } from "next/cache";
import { expenseInput, recordExpense } from "@erp/core/accounting";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function recordExpenseAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.EXPENSE_RECORD);

  const parsed = expenseInput.safeParse({
    branchId: formData.get("branchId"),
    expenseDate: formData.get("expenseDate"),
    accountCode: formData.get("accountCode"),
    amount: formData.get("amount"),
    paidFrom: formData.get("paidFrom"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await recordExpense(tenantId, userId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to record expense" };
  }

  revalidatePath("/accounting/expenses");
  revalidatePath("/accounting/reports");
  return {};
}
