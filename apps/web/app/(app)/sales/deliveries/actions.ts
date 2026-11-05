"use server";

import { revalidatePath } from "next/cache";
import { createDelivery, deliveryInput } from "@erp/core/sales";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createDeliveryAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.DELIVERY_CREATE);

  const parsed = deliveryInput.safeParse({
    branchId: formData.get("branchId"),
    warehouseId: formData.get("warehouseId"),
    customerId: formData.get("customerId"),
    deliveryDate: formData.get("deliveryDate"),
    note: formData.get("note") || undefined,
    lines: [
      {
        productVariantId: formData.get("productVariantId"),
        quantity: formData.get("quantity"),
        batchNumber: formData.get("batchNumber") || undefined,
      },
    ],
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await createDelivery(tenantId, userId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create delivery" };
  }

  revalidatePath("/sales/deliveries");
  revalidatePath("/inventory");
  return {};
}
