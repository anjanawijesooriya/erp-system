import { eq, sql } from "drizzle-orm";
import { db } from "@erp/db";
import { goodsReceiptNotes, goodsReceiptNoteLines, purchaseOrders } from "@erp/db/schema";
import { nextDocNumber } from "../doc-numbers";
import { postMovement } from "../inventory/movements";
import { postGrnJournal } from "../accounting/auto-posting";
import type { DbTx } from "../tenant-context";
import type { GrnInput } from "./schemas";

/** Flips a PO to "closed" once every line has had at least its ordered quantity received across all linked GRNs. */
async function closePurchaseOrderIfFullyReceived(tx: DbTx, purchaseOrderId: string) {
  const po = await tx.query.purchaseOrders.findFirst({
    where: eq(purchaseOrders.id, purchaseOrderId),
    with: { lines: true },
  });
  if (!po || po.status !== "open") return;

  const receivedRows = await tx
    .select({
      productVariantId: goodsReceiptNoteLines.productVariantId,
      total: sql<string>`coalesce(sum(${goodsReceiptNoteLines.receivedQty}), 0)`,
    })
    .from(goodsReceiptNoteLines)
    .innerJoin(goodsReceiptNotes, eq(goodsReceiptNoteLines.grnId, goodsReceiptNotes.id))
    .where(eq(goodsReceiptNotes.purchaseOrderId, po.id))
    .groupBy(goodsReceiptNoteLines.productVariantId);

  const receivedMap = new Map(receivedRows.map((r) => [r.productVariantId, Number(r.total)]));
  const fullyReceived = po.lines.every((l) => (receivedMap.get(l.productVariantId) ?? 0) >= Number(l.orderedQty) - 0.0001);

  if (fullyReceived) {
    await tx.update(purchaseOrders).set({ status: "closed" }).where(eq(purchaseOrders.id, po.id));
  }
}

/**
 * Posts immediately, like Phase 3's transfers/adjustments — no draft
 * state. Each line writes a "grn" stock movement with the real purchase
 * unit cost, which is what actually rolls the warehouse's weighted-average
 * cost forward for the first time; everything before this in the ledger
 * only ever moved or corrected existing cost.
 */
export async function createGrn(tenantId: string, userId: string, input: GrnInput) {
  return db.transaction(async (tx) => {
    const docNumber = await nextDocNumber(tx, { tenantId, branchId: input.branchId }, "grn", "GRN");

    const [grn] = await tx
      .insert(goodsReceiptNotes)
      .values({
        tenantId,
        branchId: input.branchId,
        warehouseId: input.warehouseId,
        supplierId: input.supplierId,
        purchaseOrderId: input.purchaseOrderId,
        docNumber,
        receivedDate: input.receivedDate,
        note: input.note,
        createdByUserId: userId,
      })
      .returning();
    if (!grn) throw new Error("Failed to create GRN");

    for (const line of input.lines) {
      await tx.insert(goodsReceiptNoteLines).values({
        grnId: grn.id,
        productVariantId: line.productVariantId,
        receivedQty: line.quantity.toString(),
        unitCost: line.unitCost.toString(),
        batchNumber: line.batchNumber,
        expiryDate: line.expiryDate,
      });

      await postMovement(tx, {
        tenantId,
        warehouseId: input.warehouseId,
        productVariantId: line.productVariantId,
        movementType: "grn",
        direction: "in",
        quantity: line.quantity,
        unitCost: line.unitCost,
        batchNumber: line.batchNumber,
        expiryDate: line.expiryDate,
        referenceType: "grn",
        referenceId: grn.id,
        createdByUserId: userId,
      });
    }

    const totalCost = input.lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);
    await postGrnJournal(
      tx,
      { tenantId, branchId: input.branchId, userId },
      { grnId: grn.id, receivedDate: input.receivedDate, totalCost },
    );

    if (input.purchaseOrderId) {
      await closePurchaseOrderIfFullyReceived(tx, input.purchaseOrderId);
    }

    return grn;
  });
}

export async function listGrns(tenantId: string) {
  return db.query.goodsReceiptNotes.findMany({
    where: eq(goodsReceiptNotes.tenantId, tenantId),
    orderBy: (g, { desc }) => [desc(g.createdAt)],
    with: { lines: { with: { productVariant: true } }, supplier: true, warehouse: true, purchaseOrder: true },
  });
}
