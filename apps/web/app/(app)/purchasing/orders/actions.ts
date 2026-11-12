"use server";

import { revalidatePath } from "next/cache";
import { createPurchaseOrder, purchaseOrderInput, cancelPurchaseOrder } from "@erp/core/purchasing";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createPurchaseOrderAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.PURCHASE_ORDER_CREATE);

  const linesRaw = formData.get("lines");
  let lines: unknown;
  try {
    lines = JSON.parse(typeof linesRaw === "string" ? linesRaw : "[]");
  } catch {
    return { error: "Invalid line items." };
  }

  const parsed = purchaseOrderInput.safeParse({
    branchId: formData.get("branchId"),
    supplierId: formData.get("supplierId"),
    orderDate: formData.get("orderDate"),
    expectedDate: formData.get("expectedDate") || undefined,
    note: formData.get("note") || undefined,
    lines,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await createPurchaseOrder(tenantId, userId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create purchase order" };
  }

  revalidatePath("/purchasing/orders");
  return {};
}

export async function cancelPurchaseOrderAction(purchaseOrderId: string): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.PURCHASE_ORDER_CANCEL);

  try {
    await cancelPurchaseOrder(tenantId, purchaseOrderId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to cancel purchase order" };
  }

  revalidatePath("/purchasing/orders");
  revalidatePath("/purchasing/grn");
  return {};
}
