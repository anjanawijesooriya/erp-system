import { and, eq } from "drizzle-orm";
import { db } from "@erp/db";
import { billOfMaterials, productionOrders } from "@erp/db/schema";
import { postMovement } from "../inventory/movements";
import { getBom } from "./bom";

export async function createProductionOrder(
  tenantId: string,
  branchId: string,
  warehouseId: string,
  bomId: string,
  userId: string,
  plannedBatches: number,
) {
  const bom = await getBom(tenantId, bomId);
  if (!bom) throw new Error("BOM not found");

  const [row] = await db
    .insert(productionOrders)
    .values({ tenantId, branchId, warehouseId, bomId, createdByUserId: userId, plannedBatches: plannedBatches.toString() })
    .returning();
  return row;
}

export async function listProductionOrders(tenantId: string) {
  return db.query.productionOrders.findMany({
    where: eq(productionOrders.tenantId, tenantId),
    with: { branch: true, warehouse: true, bom: { with: { outputVariant: true } } },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
}

/**
 * Consumes each BOM component at its current weighted-average cost and
 * produces the output variant at the resulting aggregate cost — pure
 * stock-ledger movements (see packages/db/src/schema/manufacturing.ts),
 * no GL entry, since total inventory value is unchanged, only
 * reclassified from components to finished goods.
 */
export async function completeProductionOrder(
  tenantId: string,
  userId: string,
  productionOrderId: string,
  actualOutputQuantity: number,
) {
  return db.transaction(async (tx) => {
    const order = await tx.query.productionOrders.findFirst({
      where: and(eq(productionOrders.id, productionOrderId), eq(productionOrders.tenantId, tenantId)),
    });
    if (!order) throw new Error("Production order not found");
    if (order.status !== "draft") throw new Error("Production order has already been completed or cancelled");

    const bom = await tx.query.billOfMaterials.findFirst({
      where: eq(billOfMaterials.id, order.bomId),
      with: { lines: true },
    });
    if (!bom) throw new Error("BOM not found");

    const batches = Number(order.plannedBatches);
    let totalComponentCost = 0;

    for (const line of bom.lines) {
      const quantityNeeded = Number(line.quantity) * batches;
      const movement = await postMovement(tx, {
        tenantId,
        warehouseId: order.warehouseId,
        productVariantId: line.componentVariantId,
        movementType: "production_consumption",
        direction: "out",
        quantity: quantityNeeded,
        referenceType: "production_order",
        referenceId: order.id,
        createdByUserId: userId,
      });
      if (!movement) throw new Error("Failed to post component consumption movement");
      totalComponentCost += Number(movement.unitCost) * quantityNeeded;
    }

    // actualOutputQuantity can be 0 — a batch that consumed materials but
    // yielded nothing (spoilage); the loss then simply shows up as
    // consumed stock with no offsetting output.
    if (actualOutputQuantity > 0) {
      const outputUnitCost = totalComponentCost / actualOutputQuantity;
      await postMovement(tx, {
        tenantId,
        warehouseId: order.warehouseId,
        productVariantId: bom.outputVariantId,
        movementType: "production_output",
        direction: "in",
        quantity: actualOutputQuantity,
        unitCost: outputUnitCost,
        referenceType: "production_order",
        referenceId: order.id,
        createdByUserId: userId,
      });
    }

    const [completed] = await tx
      .update(productionOrders)
      .set({
        status: "completed",
        actualOutputQuantity: actualOutputQuantity.toString(),
        completedAt: new Date(),
      })
      .where(eq(productionOrders.id, order.id))
      .returning();

    return completed;
  });
}

export async function cancelProductionOrder(tenantId: string, productionOrderId: string) {
  const [row] = await db
    .update(productionOrders)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(productionOrders.id, productionOrderId),
        eq(productionOrders.tenantId, tenantId),
        eq(productionOrders.status, "draft"),
      ),
    )
    .returning();
  return row;
}
