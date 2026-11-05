"use server";

import { revalidatePath } from "next/cache";
import { createSalesInvoice, salesInvoiceInput } from "@erp/core/sales";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createSalesInvoiceAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.SALES_INVOICE_CREATE);

  const parsed = salesInvoiceInput.safeParse({
    branchId: formData.get("branchId"),
    customerId: formData.get("customerId"),
    invoiceDate: formData.get("invoiceDate"),
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
    await createSalesInvoice(tenantId, userId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create sales invoice" };
  }

  revalidatePath("/sales/invoices");
  revalidatePath("/sales/receivables");
  return {};
}
