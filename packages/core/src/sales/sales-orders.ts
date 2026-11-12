import { and, eq } from "drizzle-orm";
import { db } from "@erp/db";
import { salesOrders, salesOrderLines, salesInvoices } from "@erp/db/schema";
import { nextDocNumber } from "../doc-numbers";
import type { SalesOrderInput } from "./schemas";

export async function createSalesOrder(tenantId: string, userId: string, input: SalesOrderInput) {
  return db.transaction(async (tx) => {
    const docNumber = await nextDocNumber(tx, { tenantId, branchId: input.branchId }, "sales_order", "SO");

    const [order] = await tx
      .insert(salesOrders)
      .values({
        tenantId,
        branchId: input.branchId,
        customerId: input.customerId,
        quotationId: input.quotationId,
        docNumber,
        orderDate: input.orderDate,
        note: input.note,
        createdByUserId: userId,
      })
      .returning();
    if (!order) throw new Error("Failed to create sales order");

    for (const line of input.lines) {
      await tx.insert(salesOrderLines).values({
        salesOrderId: order.id,
        productVariantId: line.productVariantId,
        qty: line.quantity.toString(),
        unitPrice: line.unitPrice.toString(),
      });
    }

    return order;
  });
}

export async function listSalesOrders(tenantId: string) {
  return db.query.salesOrders.findMany({
    where: eq(salesOrders.tenantId, tenantId),
    orderBy: (o, { desc }) => [desc(o.createdAt)],
    with: { lines: { with: { productVariant: true } }, customer: true },
  });
}

/**
 * Cancels a sales order. Only allowed while it's still "open" and no sales
 * invoice has been billed from it yet — once one exists, cancelling the
 * order underneath it would leave that invoice's `salesOrderId` dangling.
 */
export async function cancelSalesOrder(tenantId: string, salesOrderId: string) {
  const existing = await db.query.salesOrders.findFirst({
    where: and(eq(salesOrders.id, salesOrderId), eq(salesOrders.tenantId, tenantId)),
  });
  if (!existing) throw new Error("Sales order not found");
  if (existing.status !== "open") throw new Error("Only an open sales order can be cancelled");

  const [invoice] = await db
    .select({ id: salesInvoices.id })
    .from(salesInvoices)
    .where(eq(salesInvoices.salesOrderId, salesOrderId))
    .limit(1);
  if (invoice) throw new Error("A sales invoice has already been billed from this order");

  const [row] = await db
    .update(salesOrders)
    .set({ status: "cancelled" })
    .where(and(eq(salesOrders.id, salesOrderId), eq(salesOrders.tenantId, tenantId)))
    .returning();
  return row;
}
