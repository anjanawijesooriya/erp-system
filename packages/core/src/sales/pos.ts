import { db } from "@erp/db";
import { salesInvoices } from "@erp/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateWalkInCustomer } from "../parties/customers";
import { insertSalesInvoice } from "./sales-invoices";
import { insertDelivery } from "./deliveries";
import { insertSalesPayment } from "./sales-payments";
import { getOpenRegisterSession, NoOpenRegisterError } from "../pos/cash-register";
import type { PosSaleInput } from "./schemas";

/**
 * A POS sale bundles what the B2B flow keeps as three separate documents
 * (invoice, delivery, payment) into one checkout: raise the invoice, ship
 * the goods, and collect full payment, all in one transaction, all marked
 * complete immediately. No customer selected = attributed to the tenant's
 * walk-in customer record (see getOrCreateWalkInCustomer).
 */
export async function createPosSale(tenantId: string, userId: string, input: PosSaleInput) {
  const openSession = await getOpenRegisterSession(tenantId, input.branchId);
  if (!openSession) throw new NoOpenRegisterError();

  const customerId = input.customerId ?? (await getOrCreateWalkInCustomer(tenantId)).id;
  const totalAmount = input.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const today = new Date().toISOString().slice(0, 10);

  return db.transaction(async (tx) => {
    const invoice = await insertSalesInvoice(tx, tenantId, userId, {
      branchId: input.branchId,
      customerId,
      invoiceDate: today,
      lines: input.lines,
    });

    await insertDelivery(tx, tenantId, userId, {
      branchId: input.branchId,
      warehouseId: input.warehouseId,
      customerId,
      invoiceId: invoice.id,
      deliveryDate: today,
      lines: input.lines.map((l) => ({ productVariantId: l.productVariantId, quantity: l.quantity })),
    });

    await insertSalesPayment(tx, tenantId, userId, {
      branchId: input.branchId,
      customerId,
      paymentDate: today,
      method: input.method,
      amount: totalAmount,
    });

    const [paidInvoice] = await tx
      .update(salesInvoices)
      .set({ status: "paid" })
      .where(eq(salesInvoices.id, invoice.id))
      .returning();

    return paidInvoice ?? invoice;
  });
}
