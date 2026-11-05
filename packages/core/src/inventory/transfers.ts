import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { stockTransfers, stockTransferLines } from "@erp/db/schema";
import { postMovement } from "./movements";
import type { TransferInput } from "./schemas";

/**
 * Transfers are posted immediately (no draft/approval step in this MVP —
 * the `draft`/`cancelled` statuses exist in the schema for a future
 * approval workflow). Each line posts a transfer_out at the source
 * warehouse and a transfer_in at the destination, carrying the source's
 * weighted-average cost forward so the destination's WAC isn't distorted.
 */
export async function createTransfer(tenantId: string, userId: string, input: TransferInput) {
  if (input.fromWarehouseId === input.toWarehouseId) {
    throw new Error("Source and destination warehouse must be different");
  }

  return db.transaction(async (tx) => {
    const [transfer] = await tx
      .insert(stockTransfers)
      .values({
        tenantId,
        fromWarehouseId: input.fromWarehouseId,
        toWarehouseId: input.toWarehouseId,
        note: input.note,
        status: "completed",
        createdByUserId: userId,
        completedAt: new Date(),
      })
      .returning();
    if (!transfer) throw new Error("Failed to create transfer");

    for (const line of input.lines) {
      await tx.insert(stockTransferLines).values({
        transferId: transfer.id,
        productVariantId: line.productVariantId,
        quantity: line.quantity.toString(),
        batchNumber: line.batchNumber,
      });

      const outMovement = await postMovement(tx, {
        tenantId,
        warehouseId: input.fromWarehouseId,
        productVariantId: line.productVariantId,
        movementType: "transfer_out",
        direction: "out",
        quantity: line.quantity,
        batchNumber: line.batchNumber,
        referenceType: "stock_transfer",
        referenceId: transfer.id,
        createdByUserId: userId,
      });

      await postMovement(tx, {
        tenantId,
        warehouseId: input.toWarehouseId,
        productVariantId: line.productVariantId,
        movementType: "transfer_in",
        direction: "in",
        quantity: line.quantity,
        unitCost: Number(outMovement!.unitCost),
        batchNumber: line.batchNumber,
        referenceType: "stock_transfer",
        referenceId: transfer.id,
        createdByUserId: userId,
      });
    }

    return transfer;
  });
}

export async function listTransfers(tenantId: string) {
  return db.query.stockTransfers.findMany({
    where: eq(stockTransfers.tenantId, tenantId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    with: { lines: true, fromWarehouse: true, toWarehouse: true },
  });
}
