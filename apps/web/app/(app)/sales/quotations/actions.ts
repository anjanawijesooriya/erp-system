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

  const parsed = quotationInput.safeParse({
    branchId: formData.get("branchId"),
    customerId: formData.get("customerId"),
    quoteDate: formData.get("quoteDate"),
    validUntil: formData.get("validUntil") || undefined,
    note: formData.get("note") || undefined,
    lines,
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
