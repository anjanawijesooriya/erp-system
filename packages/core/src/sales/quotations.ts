import { and, eq } from "drizzle-orm";
import { db } from "@erp/db";
import { quotations, quotationLines, salesOrders } from "@erp/db/schema";
import { nextDocNumber } from "../doc-numbers";
import type { QuotationInput } from "./schemas";

export async function createQuotation(tenantId: string, userId: string, input: QuotationInput) {
  return db.transaction(async (tx) => {
    const docNumber = await nextDocNumber(tx, { tenantId, branchId: input.branchId }, "quotation", "QTN");

    const [quotation] = await tx
      .insert(quotations)
      .values({
        tenantId,
        branchId: input.branchId,
        customerId: input.customerId,
        docNumber,
        quoteDate: input.quoteDate,
        validUntil: input.validUntil,
        note: input.note,
        createdByUserId: userId,
      })
      .returning();
    if (!quotation) throw new Error("Failed to create quotation");

    for (const line of input.lines) {
      await tx.insert(quotationLines).values({
        quotationId: quotation.id,
        productVariantId: line.productVariantId,
        qty: line.quantity.toString(),
        unitPrice: line.unitPrice.toString(),
      });
    }

    return quotation;
  });
}

export async function listQuotations(tenantId: string) {
  return db.query.quotations.findMany({
    where: eq(quotations.tenantId, tenantId),
    orderBy: (q, { desc }) => [desc(q.createdAt)],
    with: { lines: { with: { productVariant: true } }, customer: true },
  });
}

/**
 * Cancels a quotation. Only allowed while it's still "open" and no sales
 * order has been created from it yet — once one exists, cancelling the
 * quotation underneath it would leave that order's `quotationId` dangling.
 */
export async function cancelQuotation(tenantId: string, quotationId: string) {
  const existing = await db.query.quotations.findFirst({
    where: and(eq(quotations.id, quotationId), eq(quotations.tenantId, tenantId)),
  });
  if (!existing) throw new Error("Quotation not found");
  if (existing.status !== "open") throw new Error("Only an open quotation can be cancelled");

  const [order] = await db
    .select({ id: salesOrders.id })
    .from(salesOrders)
    .where(eq(salesOrders.quotationId, quotationId))
    .limit(1);
  if (order) throw new Error("A sales order has already been created from this quotation");

  const [row] = await db
    .update(quotations)
    .set({ status: "cancelled" })
    .where(and(eq(quotations.id, quotationId), eq(quotations.tenantId, tenantId)))
    .returning();
  return row;
}
