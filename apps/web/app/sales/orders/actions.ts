"use server";

import { revalidatePath } from "next/cache";
import { createSalesOrder, salesOrderInput } from "@erp/core/sales";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createSalesOrderAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.SALES_ORDER_CREATE);

  const parsed = salesOrderInput.safeParse({
    branchId: formData.get("branchId"),
    customerId: formData.get("customerId"),
    orderDate: formData.get("orderDate"),
    note: formData.get("note") || undefined,
    lines: [
      {
        productVariantId: formData.get("productVariantId"),
        quantity: formData.get("quantity"),
        unitPrice: formData.get("unitPrice"),
      },
    ],
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
