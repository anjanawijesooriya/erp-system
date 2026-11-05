"use server";

import { revalidatePath } from "next/cache";
import { createSalesReturn, salesReturnInput } from "@erp/core/sales";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createSalesReturnAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.SALES_RETURN_CREATE);

  const parsed = salesReturnInput.safeParse({
    branchId: formData.get("branchId"),
    warehouseId: formData.get("warehouseId"),
    customerId: formData.get("customerId"),
    returnDate: formData.get("returnDate"),
    reason: formData.get("reason"),
    note: formData.get("note") || undefined,
    lines: [
      {
        productVariantId: formData.get("productVariantId"),
        quantity: formData.get("quantity"),
        unitPrice: formData.get("unitPrice") || 0,
      },
    ],
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await createSalesReturn(tenantId, userId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create sales return" };
  }

  revalidatePath("/sales/returns");
  revalidatePath("/inventory");
  return {};
}
