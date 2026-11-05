"use server";

import { revalidatePath } from "next/cache";
import { cancelProductionOrder, completeProductionOrder, createProductionOrder } from "@erp/core/manufacturing";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { assertModule } from "@erp/core/plans";
import { requireSession } from "@/lib/session";

export async function createProductionOrderAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertModule(tenantId, "manufacturing");
  await assertCan(userId, PERMISSIONS.PRODUCTION_ORDER_MANAGE);

  const branchId = String(formData.get("branchId") ?? "");
  const warehouseId = String(formData.get("warehouseId") ?? "");
  const bomId = String(formData.get("bomId") ?? "");
  const plannedBatches = Number(formData.get("plannedBatches"));

  if (!branchId || !warehouseId || !bomId || !plannedBatches) {
    return { error: "All fields are required" };
  }

  try {
    await createProductionOrder(tenantId, branchId, warehouseId, bomId, userId, plannedBatches);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create production order" };
  }
  revalidatePath("/manufacturing/production");
  return {};
}

export async function completeProductionOrderAction(productionOrderId: string, actualOutputQuantity: number) {
  const { tenantId, userId } = await requireSession();
  await assertModule(tenantId, "manufacturing");
  await assertCan(userId, PERMISSIONS.PRODUCTION_ORDER_MANAGE);
  await completeProductionOrder(tenantId, userId, productionOrderId, actualOutputQuantity);
  revalidatePath("/manufacturing/production");
}

export async function cancelProductionOrderAction(productionOrderId: string) {
  const { tenantId, userId } = await requireSession();
  await assertModule(tenantId, "manufacturing");
  await assertCan(userId, PERMISSIONS.PRODUCTION_ORDER_MANAGE);
  await cancelProductionOrder(tenantId, productionOrderId);
  revalidatePath("/manufacturing/production");
}
