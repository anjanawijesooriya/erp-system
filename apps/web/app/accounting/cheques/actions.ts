"use server";

import { revalidatePath } from "next/cache";
import { chequeInput, recordCheque, updateChequeStatus } from "@erp/core/accounting";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function recordChequeAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.CHEQUE_MANAGE);

  const direction = formData.get("direction");
  const parsed = chequeInput.safeParse({
    branchId: formData.get("branchId"),
    direction,
    customerId: direction === "received" ? formData.get("customerId") || undefined : undefined,
    supplierId: direction === "issued" ? formData.get("supplierId") || undefined : undefined,
    chequeNumber: formData.get("chequeNumber"),
    bankName: formData.get("bankName") || undefined,
    chequeDate: formData.get("chequeDate"),
    amount: formData.get("amount"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await recordCheque(tenantId, userId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to record cheque" };
  }

  revalidatePath("/accounting/cheques");
  return {};
}

export async function updateChequeStatusAction(
  chequeId: string,
  newStatus: "deposited" | "cleared" | "bounced" | "cancelled",
) {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.CHEQUE_MANAGE);
  const today = new Date().toISOString().slice(0, 10);
  await updateChequeStatus(tenantId, userId, chequeId, newStatus, today);
  revalidatePath("/accounting/cheques");
  revalidatePath("/accounting/journal");
}
