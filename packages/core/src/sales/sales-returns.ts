import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { salesReturns, salesReturnLines } from "@erp/db/schema";
import { nextDocNumber } from "../doc-numbers";
import { postMovement } from "../inventory/movements";
import { postSalesReturnJournal } from "../accounting/auto-posting";
import type { SalesReturnInput } from "./schemas";

export async function createSalesReturn(tenantId: string, userId: string, input: SalesReturnInput) {
  return db.transaction(async (tx) => {
    const docNumber = await nextDocNumber(tx, { tenantId, branchId: input.branchId }, "sales_return", "SRET");

    const [ret] = await tx
      .insert(salesReturns)
      .values({
        tenantId,
        branchId: input.branchId,
        warehouseId: input.warehouseId,
        customerId: input.customerId,
        invoiceId: input.invoiceId,
        docNumber,
        returnDate: input.returnDate,
        reason: input.reason,
        note: input.note,
        createdByUserId: userId,
      })
      .returning();
    if (!ret) throw new Error("Failed to create sales return");

    let totalCost = 0;
    let totalCreditValue = 0;
    for (const line of input.lines) {
      await tx.insert(salesReturnLines).values({
        returnId: ret.id,
        productVariantId: line.productVariantId,
        qty: line.quantity.toString(),
        unitPrice: line.unitPrice.toString(),
      });

      const movement = await postMovement(tx, {
        tenantId,
        warehouseId: input.warehouseId,
        productVariantId: line.productVariantId,
        movementType: "sales_return",
        direction: "in",
        quantity: line.quantity,
        referenceType: "sales_return",
        referenceId: ret.id,
        note: input.note,
        createdByUserId: userId,
      });
      totalCost += line.quantity * Number(movement!.unitCost);
      totalCreditValue += line.quantity * line.unitPrice;
    }

    await postSalesReturnJournal(
      tx,
      { tenantId, branchId: input.branchId, userId },
      { returnId: ret.id, returnDate: input.returnDate, totalCost, totalCreditValue },
    );

    return ret;
  });
}

export async function listSalesReturns(tenantId: string) {
  return db.query.salesReturns.findMany({
    where: eq(salesReturns.tenantId, tenantId),
    orderBy: (r, { desc }) => [desc(r.createdAt)],
    with: { lines: { with: { productVariant: true } }, customer: true, warehouse: true },
  });
}
