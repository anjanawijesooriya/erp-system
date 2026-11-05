"use server";

import { revalidatePath } from "next/cache";
import { createSupplierInvoice, supplierInvoiceInput } from "@erp/core/purchasing";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createSupplierInvoiceAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.SUPPLIER_INVOICE_CREATE);

  const parsed = supplierInvoiceInput.safeParse({
    branchId: formData.get("branchId"),
    supplierId: formData.get("supplierId"),
    supplierRefNumber: formData.get("supplierRefNumber") || undefined,
    invoiceDate: formData.get("invoiceDate"),
    note: formData.get("note") || undefined,
    lines: [
      {
        productVariantId: formData.get("productVariantId"),
        quantity: formData.get("quantity"),
        unitCost: formData.get("unitCost"),
      },
    ],
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await createSupplierInvoice(tenantId, userId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create supplier invoice" };
  }

  revalidatePath("/purchasing/invoices");
  revalidatePath("/purchasing/payables");
  return {};
}
