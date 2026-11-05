import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { salesOrders, salesOrderLines } from "@erp/db/schema";
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
