"use server";

import { revalidatePath } from "next/cache";
import { createQuotation, quotationInput, cancelQuotation } from "@erp/core/sales";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createQuotationAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.QUOTATION_CREATE);

  const parsed = quotationInput.safeParse({
    branchId: formData.get("branchId"),
    customerId: formData.get("customerId"),
    quoteDate: formData.get("quoteDate"),
    validUntil: formData.get("validUntil") || undefined,
    note: formData.get("note") || undefined,
    lines: [
      {
        productVariantId: formData.get("productVariantId"),
        quantity: formData.get("quantity"),
        unitPrice: formData.get("unitPrice"),
      },
    ],
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await createQuotation(tenantId, userId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create quotation" };
  }

  revalidatePath("/sales/quotations");
  return {};
}

export async function cancelQuotationAction(quotationId: string): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.QUOTATION_CANCEL);

  try {
    await cancelQuotation(tenantId, quotationId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to cancel quotation" };
  }

  revalidatePath("/sales/quotations");
  return {};
}
