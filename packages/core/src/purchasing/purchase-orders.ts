import { and, eq } from "drizzle-orm";
import { db } from "@erp/db";
import { purchaseOrders, purchaseOrderLines } from "@erp/db/schema";
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

export async function closePurchaseOrder(tenantId: string, purchaseOrderId: string) {
  const [row] = await db
    .update(purchaseOrders)
    .set({ status: "closed" })
    .where(and(eq(purchaseOrders.id, purchaseOrderId), eq(purchaseOrders.tenantId, tenantId)))
    .returning();
  return row;
}
