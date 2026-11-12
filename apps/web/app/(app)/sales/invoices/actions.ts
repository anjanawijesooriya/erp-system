"use server";

import { revalidatePath } from "next/cache";
import { createSalesInvoice, salesInvoiceInput, voidSalesInvoice } from "@erp/core/sales";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createSalesInvoiceAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.SALES_INVOICE_CREATE);

  const linesRaw = formData.get("lines");
  let lines: unknown;
  try {
    const parsedLines = JSON.parse(typeof linesRaw === "string" ? linesRaw : "[]");
    lines = Array.isArray(parsedLines)
      ? parsedLines.map((l: { productVariantId: string; quantity: number; unitCost: number }) => ({
          productVariantId: l.productVariantId,
          quantity: l.quantity,
          unitPrice: l.unitCost,
        }))
      : parsedLines;
  } catch {
    return { error: "Invalid line items." };
  }

  const parsed = salesInvoiceInput.safeParse({
    branchId: formData.get("branchId"),
    customerId: formData.get("customerId"),
    invoiceDate: formData.get("invoiceDate"),
    note: formData.get("note") || undefined,
    discountPercent: formData.get("discountPercent") || undefined,
    lines,
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

export async function voidSalesInvoiceAction(invoiceId: string): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.SALES_INVOICE_VOID);

  try {
    await voidSalesInvoice(tenantId, userId, invoiceId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to void sales invoice" };
  }

  revalidatePath("/sales/invoices");
  revalidatePath(`/sales/invoices/${invoiceId}`);
  revalidatePath("/sales/receivables");
  return {};
}
