"use server";

import { revalidatePath } from "next/cache";
import { startStockCountInput, submitStockCount } from "@erp/core/inventory";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function submitStockCountAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.STOCK_COUNT_MANAGE);

  const linesRaw = formData.get("lines");
  let lines: { productVariantId: string; countedQuantity: number }[];
  try {
    lines = JSON.parse(typeof linesRaw === "string" ? linesRaw : "[]");
  } catch {
    return { error: "Invalid count lines." };
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    return { error: "Count at least one item." };
  }

  const parsed = startStockCountInput.safeParse({
    warehouseId: formData.get("warehouseId"),
    note: formData.get("note") || undefined,
    productVariantIds: lines.map((l) => l.productVariantId),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const countedQuantities: Record<string, number> = {};
  for (const line of lines) {
    if (!Number.isFinite(line.countedQuantity) || line.countedQuantity < 0) {
      return { error: "Counted quantity must be a non-negative number." };
    }
    countedQuantities[line.productVariantId] = line.countedQuantity;
  }

  try {
    await submitStockCount(tenantId, userId, {
      ...parsed.data,
      countedQuantities,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to submit stock count" };
  }

  revalidatePath("/inventory/counts");
  revalidatePath("/inventory");
  return {};
}
