"use server";

import { revalidatePath } from "next/cache";
import { createGrn, grnInput } from "@erp/core/purchasing";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createGrnAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.GRN_CREATE);

  const linesRaw = formData.get("lines");
  let lines: unknown;
  try {
    lines = JSON.parse(typeof linesRaw === "string" ? linesRaw : "[]");
  } catch {
    return { error: "Invalid line items." };
  }

  const parsed = grnInput.safeParse({
    branchId: formData.get("branchId"),
    warehouseId: formData.get("warehouseId"),
    supplierId: formData.get("supplierId"),
    purchaseOrderId: formData.get("purchaseOrderId") || undefined,
    receivedDate: formData.get("receivedDate"),
    note: formData.get("note") || undefined,
    lines,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await createGrn(tenantId, userId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create GRN" };
  }

  revalidatePath("/purchasing/grn");
  revalidatePath("/inventory");
  return {};
}
