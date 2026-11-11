import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@erp/db";
import { suppliers, supplierInvoices, supplierInvoiceLines, goodsReceiptNotes } from "@erp/db/schema";
import { nextDocNumber } from "../doc-numbers";
import { postSupplierInvoiceJournal } from "../accounting/auto-posting";
import type { SupplierInvoiceInput } from "./schemas";

export async function createSupplierInvoice(tenantId: string, userId: string, input: SupplierInvoiceInput) {
  return db.transaction(async (tx) => {
    const docNumber = await nextDocNumber(
      tx,
      { tenantId, branchId: input.branchId },
      "supplier_invoice",
      "SINV",
    );

    const supplier = await tx.query.suppliers.findFirst({ where: eq(suppliers.id, input.supplierId) });
    if (!supplier) throw new Error("Supplier not found");

    const invoiceDate = new Date(input.invoiceDate);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + supplier.creditTermDays);

    const totalAmount = input.lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

    const [invoice] = await tx
      .insert(supplierInvoices)
      .values({
        tenantId,
        branchId: input.branchId,
        supplierId: input.supplierId,
        grnId: input.grnId,
        docNumber,
        supplierRefNumber: input.supplierRefNumber,
        invoiceDate: input.invoiceDate,
        dueDate: dueDate.toISOString().slice(0, 10),
        totalAmount: totalAmount.toString(),
        createdByUserId: userId,
      })
      .returning();
    if (!invoice) throw new Error("Failed to create supplier invoice");

    for (const line of input.lines) {
      await tx.insert(supplierInvoiceLines).values({
        invoiceId: invoice.id,
        productVariantId: line.productVariantId,
        qty: line.quantity.toString(),
        unitCost: line.unitCost.toString(),
        lineTotal: (line.quantity * line.unitCost).toString(),
      });
    }

    await postSupplierInvoiceJournal(
      tx,
      { tenantId, branchId: input.branchId, userId },
      { invoiceId: invoice.id, invoiceDate: input.invoiceDate, totalAmount, hasGrn: !!input.grnId },
    );

    return invoice;
  });
}

/**
 * GRNs for this tenant that no supplier invoice has been billed against
 * yet — what a supplier invoice's "bill from GRN" picker offers. A GRN is
 * billed in full by a single invoice (one `grnId` per invoice), so once
 * any invoice references it, it drops off this list.
 */
export async function listUninvoicedGrns(tenantId: string) {
  const billed = await db
    .select({ grnId: supplierInvoices.grnId })
    .from(supplierInvoices)
    .where(and(eq(supplierInvoices.tenantId, tenantId), isNotNull(supplierInvoices.grnId)));
  const billedIds = new Set(billed.map((r) => r.grnId).filter((id): id is string => !!id));

  const grns = await db.query.goodsReceiptNotes.findMany({
    where: eq(goodsReceiptNotes.tenantId, tenantId),
    with: { lines: true },
    orderBy: (g, { desc }) => [desc(g.createdAt)],
  });

  return grns
    .filter((g) => !billedIds.has(g.id))
    .map((g) => ({
      id: g.id,
      docNumber: g.docNumber,
      supplierId: g.supplierId,
      lines: g.lines.map((l) => ({
        productVariantId: l.productVariantId,
        quantity: Number(l.receivedQty),
        unitCost: Number(l.unitCost),
      })),
    }));
}

export async function listSupplierInvoices(tenantId: string) {
  return db.query.supplierInvoices.findMany({
    where: eq(supplierInvoices.tenantId, tenantId),
    orderBy: (i, { desc }) => [desc(i.createdAt)],
    with: { lines: true, supplier: true, allocations: true, grn: true },
  });
}
