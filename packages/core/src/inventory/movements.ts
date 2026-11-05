import { and, eq } from "drizzle-orm";
import { stockBalances, stockMovements } from "@erp/db/schema";
import type { DbTx } from "../tenant-context";

export interface PostMovementParams {
  tenantId: string;
  warehouseId: string;
  productVariantId: string;
  movementType: (typeof stockMovements.$inferInsert)["movementType"];
  direction: "in" | "out";
  quantity: number; // always positive, base UoM
  /**
   * Unit cost for an "in" movement, used to roll the weighted-average cost
   * forward. If omitted, the warehouse's current average cost is used
   * (cost-neutral — e.g. a stock-count surplus or a transfer that carries
   * its source cost forward). Ignored for "out" movements: the recorded
   * cost is always the current average cost at the moment of the movement.
   */
  unitCost?: number;
  batchNumber?: string;
  expiryDate?: string;
  referenceType: string;
  referenceId?: string;
  note?: string;
  createdByUserId: string;
}

export class InsufficientStockError extends Error {
  constructor(available: number, requested: number) {
    super(`Insufficient stock: ${available} available, ${requested} requested`);
    this.name = "InsufficientStockError";
  }
}

/**
 * The single writer to the stock ledger. Locks (SELECT ... FOR UPDATE) the
 * balance row for this (warehouse, variant, batch) so concurrent postings
 * against the same stock can't race, rolls the weighted-average cost
 * forward, then writes the immutable movement row. Must be called inside
 * the same transaction as whatever is calling it (transfer, adjustment,
 * stock count, and — in later phases — GRN/sale posting).
 */
export async function postMovement(tx: DbTx, params: PostMovementParams) {
  if (params.quantity <= 0) {
    throw new Error("Movement quantity must be positive");
  }

  const batchKey = params.batchNumber ?? "";

  const [existing] = await tx
    .select()
    .from(stockBalances)
    .where(
      and(
        eq(stockBalances.warehouseId, params.warehouseId),
        eq(stockBalances.productVariantId, params.productVariantId),
        eq(stockBalances.batchNumber, batchKey),
      ),
    )
    .for("update");

  const existingQty = existing ? Number(existing.quantity) : 0;
  const existingAvgCost = existing ? Number(existing.averageCost) : 0;

  let newQty: number;
  let newAvgCost: number;
  let recordedUnitCost: number;

  if (params.direction === "in") {
    const incomingCost = params.unitCost ?? existingAvgCost;
    newQty = existingQty + params.quantity;
    newAvgCost = newQty === 0 ? 0 : (existingQty * existingAvgCost + params.quantity * incomingCost) / newQty;
    recordedUnitCost = incomingCost;
  } else {
    newQty = existingQty - params.quantity;
    if (newQty < -0.0001) {
      throw new InsufficientStockError(existingQty, params.quantity);
    }
    newQty = Math.max(newQty, 0);
    newAvgCost = existingAvgCost;
    recordedUnitCost = existingAvgCost;
  }

  if (existing) {
    await tx
      .update(stockBalances)
      .set({ quantity: newQty.toString(), averageCost: newAvgCost.toString(), updatedAt: new Date() })
      .where(eq(stockBalances.id, existing.id));
  } else {
    await tx.insert(stockBalances).values({
      tenantId: params.tenantId,
      warehouseId: params.warehouseId,
      productVariantId: params.productVariantId,
      batchNumber: batchKey,
      quantity: newQty.toString(),
      averageCost: newAvgCost.toString(),
    });
  }

  const [movement] = await tx
    .insert(stockMovements)
    .values({
      tenantId: params.tenantId,
      warehouseId: params.warehouseId,
      productVariantId: params.productVariantId,
      movementType: params.movementType,
      direction: params.direction,
      quantity: params.quantity.toString(),
      unitCost: recordedUnitCost.toString(),
      batchNumber: params.batchNumber,
      expiryDate: params.expiryDate,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      note: params.note,
      createdByUserId: params.createdByUserId,
    })
    .returning();

  return movement;
}
