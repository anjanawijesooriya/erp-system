"use server";

import { revalidatePath } from "next/cache";
import { adjustmentInput, createAdjustment } from "@erp/core/inventory";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createAdjustmentAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.STOCK_ADJUST);

  const linesRaw = formData.get("lines");
  let lines: unknown;
  try {
    lines = JSON.parse(typeof linesRaw === "string" ? linesRaw : "[]");
  } catch {
    return { error: "Invalid line items." };
  }

  const parsed = adjustmentInput.safeParse({
    warehouseId: formData.get("warehouseId"),
    reason: formData.get("reason"),
    note: formData.get("note") || undefined,
    lines,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await createAdjustment(tenantId, userId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create adjustment" };
  }

  revalidatePath("/inventory/adjustments");
  revalidatePath("/inventory");
  return {};
}
