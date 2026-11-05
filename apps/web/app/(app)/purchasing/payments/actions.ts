"use server";

import { revalidatePath } from "next/cache";
import { createSupplierPayment, supplierPaymentInput } from "@erp/core/purchasing";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createSupplierPaymentAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.SUPPLIER_PAYMENT_CREATE);

  const parsed = supplierPaymentInput.safeParse({
    branchId: formData.get("branchId"),
    supplierId: formData.get("supplierId"),
    paymentDate: formData.get("paymentDate"),
    method: formData.get("method"),
    amount: formData.get("amount"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await createSupplierPayment(tenantId, userId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create payment" };
  }

  revalidatePath("/purchasing/payments");
  revalidatePath("/purchasing/invoices");
  revalidatePath("/purchasing/payables");
  return {};
}
