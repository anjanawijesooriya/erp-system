"use server";

import { revalidatePath } from "next/cache";
import { createTransfer, transferInput } from "@erp/core/inventory";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createTransferAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.STOCK_TRANSFER);

  const parsed = transferInput.safeParse({
    fromWarehouseId: formData.get("fromWarehouseId"),
    toWarehouseId: formData.get("toWarehouseId"),
    note: formData.get("note") || undefined,
    lines: [
      {
        productVariantId: formData.get("productVariantId"),
        quantity: formData.get("quantity"),
      },
    ],
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await createTransfer(tenantId, userId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create transfer" };
  }

  revalidatePath("/inventory/transfers");
  revalidatePath("/inventory");
  return {};
}
