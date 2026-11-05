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

  const productVariantId = formData.get("productVariantId");
  const parsed = startStockCountInput.safeParse({
    warehouseId: formData.get("warehouseId"),
    note: formData.get("note") || undefined,
    productVariantIds: [productVariantId],
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const countedQuantity = Number(formData.get("countedQuantity"));
  if (!Number.isFinite(countedQuantity) || countedQuantity < 0) {
    return { error: "Counted quantity must be a non-negative number." };
  }

  try {
    await submitStockCount(tenantId, userId, {
      ...parsed.data,
      countedQuantities: { [productVariantId as string]: countedQuantity },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to submit stock count" };
  }

  revalidatePath("/inventory/counts");
  revalidatePath("/inventory");
  return {};
}
