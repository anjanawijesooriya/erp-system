import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { stockAdjustments, stockAdjustmentLines } from "@erp/db/schema";
import { postMovement } from "./movements";
import type { AdjustmentInput } from "./schemas";

export async function createAdjustment(tenantId: string, userId: string, input: AdjustmentInput) {
  return db.transaction(async (tx) => {
    const [adjustment] = await tx
      .insert(stockAdjustments)
      .values({
        tenantId,
        warehouseId: input.warehouseId,
        reason: input.reason,
        note: input.note,
        createdByUserId: userId,
      })
      .returning();
    if (!adjustment) throw new Error("Failed to create adjustment");

    for (const line of input.lines) {
      await tx.insert(stockAdjustmentLines).values({
        adjustmentId: adjustment.id,
        productVariantId: line.productVariantId,
        quantityDelta: line.quantityDelta.toString(),
        unitCost: line.unitCost.toString(),
        batchNumber: line.batchNumber,
      });

      await postMovement(tx, {
        tenantId,
        warehouseId: input.warehouseId,
        productVariantId: line.productVariantId,
        movementType: line.quantityDelta > 0 ? "adjustment_in" : "adjustment_out",
        direction: line.quantityDelta > 0 ? "in" : "out",
        quantity: Math.abs(line.quantityDelta),
        unitCost: line.quantityDelta > 0 ? line.unitCost : undefined,
        batchNumber: line.batchNumber,
        referenceType: "stock_adjustment",
        referenceId: adjustment.id,
        note: input.note,
        createdByUserId: userId,
      });
    }

    return adjustment;
  });
}

export async function listAdjustments(tenantId: string) {
  return db.query.stockAdjustments.findMany({
    where: eq(stockAdjustments.tenantId, tenantId),
    orderBy: (a, { desc }) => [desc(a.createdAt)],
    with: { lines: true, warehouse: true },
  });
}
