import { and, eq, sql } from "drizzle-orm";
import { db } from "@erp/db";
import {
  supplierInvoices,
  supplierPaymentAllocations,
  supplierPayments,
} from "@erp/db/schema";
import { nextDocNumber } from "../doc-numbers";
import { postSupplierPaymentJournal } from "../accounting/auto-posting";
import type { SupplierPaymentInput } from "./schemas";

/**
 * Allocates the payment FIFO (oldest due date first) across the supplier's
 * outstanding invoices, updating each invoice's status as it's paid off.
 * Any amount left over after every outstanding invoice is fully covered is
 * left unallocated — there's no supplier credit-balance concept yet, so an
 * overpayment just doesn't get applied anywhere (documented limitation).
 */
export async function createSupplierPayment(tenantId: string, userId: string, input: SupplierPaymentInput) {
  return db.transaction(async (tx) => {
    const docNumber = await nextDocNumber(
      tx,
      { tenantId, branchId: input.branchId },
      "supplier_payment",
      "SPAY",
    );

    const [payment] = await tx
      .insert(supplierPayments)
      .values({
        tenantId,
        branchId: input.branchId,
        supplierId: input.supplierId,
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
        id: supplierInvoices.id,
        totalAmount: supplierInvoices.totalAmount,
        applied: sql<string>`coalesce(sum(${supplierPaymentAllocations.amountApplied}), 0)`,
      })
      .from(supplierInvoices)
      .leftJoin(supplierPaymentAllocations, eq(supplierPaymentAllocations.invoiceId, supplierInvoices.id))
      .where(
        and(
          eq(supplierInvoices.tenantId, tenantId),
          eq(supplierInvoices.supplierId, input.supplierId),
          sql`${supplierInvoices.status} <> 'cancelled'`,
        ),
      )
      .groupBy(supplierInvoices.id, supplierInvoices.totalAmount, supplierInvoices.dueDate)
      .orderBy(supplierInvoices.dueDate);

    let remaining = input.amount;

    for (const inv of outstandingInvoices) {
      if (remaining <= 0.0001) break;
      const due = Number(inv.totalAmount) - Number(inv.applied);
      if (due <= 0.0001) continue;

      const toApply = Math.min(due, remaining);
      await tx.insert(supplierPaymentAllocations).values({
        paymentId: payment.id,
        invoiceId: inv.id,
        amountApplied: toApply.toString(),
      });
      remaining -= toApply;

      const newApplied = Number(inv.applied) + toApply;
      const newStatus =
        newApplied >= Number(inv.totalAmount) - 0.0001 ? "paid" : "partially_paid";
      await tx.update(supplierInvoices).set({ status: newStatus }).where(eq(supplierInvoices.id, inv.id));
    }

    // Only the portion actually applied to an invoice is posted to the
    // ledger — an unapplied remainder (overpayment beyond total
    // outstanding) isn't recorded anywhere, consistent with the documented
    // "no supplier credit balance" limitation above.
    const appliedTotal = input.amount - remaining;
    await postSupplierPaymentJournal(
      tx,
      { tenantId, branchId: input.branchId, userId },
      { paymentId: payment.id, paymentDate: input.paymentDate, amount: appliedTotal, method: input.method },
    );

    return payment;
  });
}

export async function listSupplierPayments(tenantId: string) {
  return db.query.supplierPayments.findMany({
    where: eq(supplierPayments.tenantId, tenantId),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
    with: { allocations: { with: { invoice: true } }, supplier: true },
  });
}
