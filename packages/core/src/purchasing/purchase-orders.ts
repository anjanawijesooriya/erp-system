import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@erp/db";
import { purchaseOrders, purchaseOrderLines, goodsReceiptNotes, goodsReceiptNoteLines } from "@erp/db/schema";
import { nextDocNumber } from "../doc-numbers";
import type { PurchaseOrderInput } from "./schemas";

export async function createPurchaseOrder(tenantId: string, userId: string, input: PurchaseOrderInput) {
  return db.transaction(async (tx) => {
    const docNumber = await nextDocNumber(tx, { tenantId, branchId: input.branchId }, "purchase_order", "PO");

    const [order] = await tx
      .insert(purchaseOrders)
      .values({
        tenantId,
        branchId: input.branchId,
        supplierId: input.supplierId,
        docNumber,
        orderDate: input.orderDate,
        expectedDate: input.expectedDate,
        note: input.note,
        createdByUserId: userId,
      })
      .returning();
    if (!order) throw new Error("Failed to create purchase order");

    for (const line of input.lines) {
      await tx.insert(purchaseOrderLines).values({
        purchaseOrderId: order.id,
        productVariantId: line.productVariantId,
        orderedQty: line.quantity.toString(),
        unitCost: line.unitCost.toString(),
      });
    }

    return order;
  });
}

export async function listPurchaseOrders(tenantId: string) {
  return db.query.purchaseOrders.findMany({
    where: eq(purchaseOrders.tenantId, tenantId),
    orderBy: (po, { desc }) => [desc(po.createdAt)],
    with: { lines: { with: { productVariant: true } }, supplier: true },
  });
}

/**
 * Open purchase orders with at least one line not yet fully received —
 * what a GRN's "receive against PO" picker offers. `remainingQty` nets out
 * everything already received via GRNs linked to this PO (across possibly
 * several partial receipts), so a partly-received PO only offers what's
 * still owed.
 */
export async function listOutstandingPurchaseOrders(tenantId: string) {
  const orders = await db.query.purchaseOrders.findMany({
    where: and(eq(purchaseOrders.tenantId, tenantId), eq(purchaseOrders.status, "open")),
    with: { lines: true },
    orderBy: (po, { desc }) => [desc(po.createdAt)],
  });
  if (orders.length === 0) return [];

  const receivedRows = await db
    .select({
      purchaseOrderId: goodsReceiptNotes.purchaseOrderId,
      productVariantId: goodsReceiptNoteLines.productVariantId,
      total: sql<string>`coalesce(sum(${goodsReceiptNoteLines.receivedQty}), 0)`,
    })
    .from(goodsReceiptNoteLines)
    .innerJoin(goodsReceiptNotes, eq(goodsReceiptNoteLines.grnId, goodsReceiptNotes.id))
    .where(
      inArray(
        goodsReceiptNotes.purchaseOrderId,
        orders.map((o) => o.id),
      ),
    )
    .groupBy(goodsReceiptNotes.purchaseOrderId, goodsReceiptNoteLines.productVariantId);

  const receivedMap = new Map<string, number>();
  for (const r of receivedRows) {
    if (!r.purchaseOrderId) continue;
    receivedMap.set(`${r.purchaseOrderId}:${r.productVariantId}`, Number(r.total));
  }

  const results: {
    id: string;
    docNumber: string;
    supplierId: string;
    lines: { productVariantId: string; remainingQty: number; unitCost: number }[];
  }[] = [];

  for (const po of orders) {
    const outstandingLines = po.lines
      .map((l) => {
        const received = receivedMap.get(`${po.id}:${l.productVariantId}`) ?? 0;
        const remaining = Number(l.orderedQty) - received;
        return { productVariantId: l.productVariantId, remainingQty: remaining, unitCost: Number(l.unitCost) };
      })
      .filter((l) => l.remainingQty > 0.0001);

    if (outstandingLines.length > 0) {
      results.push({ id: po.id, docNumber: po.docNumber, supplierId: po.supplierId, lines: outstandingLines });
    }
  }
  return results;
}

export async function closePurchaseOrder(tenantId: string, purchaseOrderId: string) {
  const [row] = await db
    .update(purchaseOrders)
    .set({ status: "closed" })
    .where(and(eq(purchaseOrders.id, purchaseOrderId), eq(purchaseOrders.tenantId, tenantId)))
    .returning();
  return row;
}
