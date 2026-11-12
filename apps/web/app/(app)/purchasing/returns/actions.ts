"use server";

import { revalidatePath } from "next/cache";
import { createPurchaseReturn, purchaseReturnInput } from "@erp/core/purchasing";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createPurchaseReturnAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.PURCHASE_RETURN_CREATE);

  const linesRaw = formData.get("lines");
  let lines: unknown;
  try {
    lines = JSON.parse(typeof linesRaw === "string" ? linesRaw : "[]");
  } catch {
    return { error: "Invalid line items." };
  }

  const parsed = purchaseReturnInput.safeParse({
    branchId: formData.get("branchId"),
    warehouseId: formData.get("warehouseId"),
    supplierId: formData.get("supplierId"),
    grnId: formData.get("grnId") || undefined,
    returnDate: formData.get("returnDate"),
    reason: formData.get("reason"),
    note: formData.get("note") || undefined,
    lines,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await createPurchaseReturn(tenantId, userId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create purchase return" };
  }

  revalidatePath("/purchasing/returns");
  revalidatePath("/inventory");
  return {};
}
