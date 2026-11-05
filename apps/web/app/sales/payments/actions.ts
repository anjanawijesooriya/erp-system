"use server";

import { revalidatePath } from "next/cache";
import { createSalesPayment, salesPaymentInput } from "@erp/core/sales";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createSalesPaymentAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.SALES_PAYMENT_CREATE);

  const parsed = salesPaymentInput.safeParse({
    branchId: formData.get("branchId"),
    customerId: formData.get("customerId"),
    paymentDate: formData.get("paymentDate"),
    method: formData.get("method"),
    amount: formData.get("amount"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await createSalesPayment(tenantId, userId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create receipt" };
  }

  revalidatePath("/sales/payments");
  revalidatePath("/sales/invoices");
  revalidatePath("/sales/receivables");
  return {};
}
