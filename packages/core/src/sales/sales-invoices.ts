import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { customers, salesInvoices, salesInvoiceLines } from "@erp/db/schema";
import { nextDocNumber } from "../doc-numbers";
import { postSalesInvoiceJournal } from "../accounting/auto-posting";
import type { DbTx } from "../tenant-context";
import type { SalesInvoiceInput } from "./schemas";

/**
 * Shared by the standalone invoice flow and POS (which calls this inside
 * its own transaction via `tx`, then marks the invoice paid immediately).
 */
export async function insertSalesInvoice(
  tx: DbTx,
  tenantId: string,
  userId: string,
  input: SalesInvoiceInput,
) {
  const docNumber = await nextDocNumber(tx, { tenantId, branchId: input.branchId }, "sales_invoice", "INV");

  const customer = await tx.query.customers.findFirst({ where: eq(customers.id, input.customerId) });
  if (!customer) throw new Error("Customer not found");

  const invoiceDate = new Date(input.invoiceDate);
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + customer.creditTermDays);

  const totalAmount = input.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

  const [invoice] = await tx
    .insert(salesInvoices)
    .values({
      tenantId,
      branchId: input.branchId,
      customerId: input.customerId,
      salesOrderId: input.salesOrderId,
      docNumber,
      invoiceDate: input.invoiceDate,
      dueDate: dueDate.toISOString().slice(0, 10),
      totalAmount: totalAmount.toString(),
      createdByUserId: userId,
    })
    .returning();
  if (!invoice) throw new Error("Failed to create sales invoice");

  for (const line of input.lines) {
    await tx.insert(salesInvoiceLines).values({
      invoiceId: invoice.id,
      productVariantId: line.productVariantId,
      qty: line.quantity.toString(),
      unitPrice: line.unitPrice.toString(),
      lineTotal: (line.quantity * line.unitPrice).toString(),
    });
  }

  await postSalesInvoiceJournal(
    tx,
    { tenantId, branchId: input.branchId, userId },
    { invoiceId: invoice.id, invoiceDate: input.invoiceDate, totalAmount },
  );

  return invoice;
}

export async function createSalesInvoice(tenantId: string, userId: string, input: SalesInvoiceInput) {
  return db.transaction((tx) => insertSalesInvoice(tx, tenantId, userId, input));
}

export async function listSalesInvoices(tenantId: string) {
  return db.query.salesInvoices.findMany({
    where: eq(salesInvoices.tenantId, tenantId),
    orderBy: (i, { desc }) => [desc(i.createdAt)],
    with: { lines: true, customer: true, allocations: true },
  });
}

/** Full detail for the printable invoice view — line items with their product names, customer, and branch. */
export async function getSalesInvoice(tenantId: string, invoiceId: string) {
  return db.query.salesInvoices.findFirst({
    where: (i, { and: andOp, eq: eqOp }) => andOp(eqOp(i.id, invoiceId), eqOp(i.tenantId, tenantId)),
    with: {
      lines: { with: { productVariant: true } },
      customer: true,
      branch: true,
    },
  });
}
