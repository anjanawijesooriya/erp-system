"use server";

import { revalidatePath } from "next/cache";
import { createSalesOrder, salesOrderInput, cancelSalesOrder } from "@erp/core/sales";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createSalesOrderAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.SALES_ORDER_CREATE);

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

  const parsed = salesOrderInput.safeParse({
    branchId: formData.get("branchId"),
    customerId: formData.get("customerId"),
    orderDate: formData.get("orderDate"),
    note: formData.get("note") || undefined,
    lines,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await createSalesOrder(tenantId, userId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create sales order" };
  }

  revalidatePath("/sales/orders");
  return {};
}

export async function cancelSalesOrderAction(salesOrderId: string): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.SALES_ORDER_CANCEL);

  try {
    await cancelSalesOrder(tenantId, salesOrderId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to cancel sales order" };
  }

  revalidatePath("/sales/orders");
  return {};
}
