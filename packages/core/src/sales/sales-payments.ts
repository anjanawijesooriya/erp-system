import { and, eq, sql } from "drizzle-orm";
import { db } from "@erp/db";
import { salesInvoices, salesPaymentAllocations, salesPayments } from "@erp/db/schema";
import { nextDocNumber } from "../doc-numbers";
import { postSalesPaymentJournal } from "../accounting/auto-posting";
import type { DbTx } from "../tenant-context";
import type { SalesPaymentInput } from "./schemas";

/**
 * Allocates FIFO (oldest due date first) across the customer's outstanding
 * invoices, same approach as createSupplierPayment in the purchasing
 * module. No customer credit-balance concept — an overpayment beyond total
 * outstanding is simply not allocated anywhere.
 */
export async function insertSalesPayment(
  tx: DbTx,
  tenantId: string,
  userId: string,
  input: SalesPaymentInput,
) {
  const docNumber = await nextDocNumber(tx, { tenantId, branchId: input.branchId }, "sales_payment", "RCPT");

  const [payment] = await tx
    .insert(salesPayments)
    .values({
      tenantId,
      branchId: input.branchId,
      customerId: input.customerId,
      docNumber,
      paymentDate: input.paymentDate,
      method: input.method,
      amount: input.amount.toString(),
      note: input.note,
      createdByUserId: userId,
    })
    .returning();
  if (!payment) throw new Error("Failed to create payment");

  const outstandingInvoices = await tx
    .select({
      id: salesInvoices.id,
      totalAmount: salesInvoices.totalAmount,
      applied: sql<string>`coalesce(sum(${salesPaymentAllocations.amountApplied}), 0)`,
    })
    .from(salesInvoices)
    .leftJoin(salesPaymentAllocations, eq(salesPaymentAllocations.invoiceId, salesInvoices.id))
    .where(
      and(
        eq(salesInvoices.tenantId, tenantId),
        eq(salesInvoices.customerId, input.customerId),
        sql`${salesInvoices.status} <> 'cancelled'`,
      ),
    )
    .groupBy(salesInvoices.id, salesInvoices.totalAmount, salesInvoices.dueDate)
    .orderBy(salesInvoices.dueDate);

  let remaining = input.amount;

  for (const inv of outstandingInvoices) {
    if (remaining <= 0.0001) break;
    const due = Number(inv.totalAmount) - Number(inv.applied);
    if (due <= 0.0001) continue;

    const toApply = Math.min(due, remaining);
    await tx.insert(salesPaymentAllocations).values({
      paymentId: payment.id,
      invoiceId: inv.id,
      amountApplied: toApply.toString(),
    });
    remaining -= toApply;

    const newApplied = Number(inv.applied) + toApply;
    const newStatus = newApplied >= Number(inv.totalAmount) - 0.0001 ? "paid" : "partially_paid";
    await tx.update(salesInvoices).set({ status: newStatus }).where(eq(salesInvoices.id, inv.id));
  }

  const appliedTotal = input.amount - remaining;
  await postSalesPaymentJournal(
    tx,
    { tenantId, branchId: input.branchId, userId },
    { paymentId: payment.id, paymentDate: input.paymentDate, amount: appliedTotal, method: input.method },
  );

  return payment;
}

export async function createSalesPayment(tenantId: string, userId: string, input: SalesPaymentInput) {
  return db.transaction((tx) => insertSalesPayment(tx, tenantId, userId, input));
}

export async function listSalesPayments(tenantId: string) {
  return db.query.salesPayments.findMany({
    where: eq(salesPayments.tenantId, tenantId),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
    with: { allocations: { with: { invoice: true } }, customer: true },
  });
}
