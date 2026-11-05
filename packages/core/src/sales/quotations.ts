import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { quotations, quotationLines } from "@erp/db/schema";
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
