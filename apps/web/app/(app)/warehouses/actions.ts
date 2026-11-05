"use server";

import { revalidatePath } from "next/cache";
import { createWarehouse, warehouseInput } from "@erp/core/inventory";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function createWarehouseAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.WAREHOUSE_MANAGE);

  const parsed = warehouseInput.safeParse({
    branchId: formData.get("branchId"),
    name: formData.get("name"),
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await createWarehouse(tenantId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create warehouse" };
  }

  revalidatePath("/warehouses");
  return {};
}
