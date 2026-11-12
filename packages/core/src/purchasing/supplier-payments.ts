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
 * Allocates the payment across the supplier's outstanding invoices,
 * updating each invoice's status as it's paid off.
 *
 * If `allocations` is given (the payment form's bill-picker checkboxes with
 * per-row pay amounts), each named invoice gets exactly the amount
 * specified, capped at what's actually still due — no FIFO fallback. The
 * payment's total amount is the sum of those allocations.
 *
 * Otherwise, falls back to the older single-target behavior: if `invoiceId`
 * is given, that invoice is settled first regardless of due date; any
 * amount left over after it — or the whole payment, if no invoice was
 * targeted — falls through FIFO (oldest due date first) across the rest.
 *
 * Either way, any amount left over after every outstanding invoice is fully
 * covered is left unallocated — there's no supplier credit-balance concept
 * yet, so an overpayment just doesn't get applied anywhere (documented
 * limitation).
 */
export async function createSupplierPayment(tenantId: string, userId: string, input: SupplierPaymentInput) {
  return db.transaction(async (tx) => {
    const docNumber = await nextDocNumber(
      tx,
      { tenantId, branchId: input.branchId },
      "supplier_payment",
      "SPAY",
    );

    const paymentAmount = input.allocations?.length
      ? input.allocations.reduce((sum, a) => sum + a.amount, 0)
      : (input.amount ?? 0);

    const [payment] = await tx
      .insert(supplierPayments)
      .values({
        tenantId,
        branchId: input.branchId,
        supplierId: input.supplierId,
        docNumber,
        paymentDate: input.paymentDate,
        method: input.method,
        amount: paymentAmount.toString(),
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

    let remaining = paymentAmount;

    if (input.allocations?.length) {
      for (const alloc of input.allocations) {
        const inv = outstandingInvoices.find((i) => i.id === alloc.invoiceId);
        if (!inv) continue;
        const due = Number(inv.totalAmount) - Number(inv.applied);
        if (due <= 0.0001) continue;

        const toApply = Math.min(due, alloc.amount);
        if (toApply <= 0.0001) continue;
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
    } else {
      const orderedInvoices = input.invoiceId
        ? [
            ...outstandingInvoices.filter((inv) => inv.id === input.invoiceId),
            ...outstandingInvoices.filter((inv) => inv.id !== input.invoiceId),
          ]
        : outstandingInvoices;

      for (const inv of orderedInvoices) {
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
    }

    // Only the portion actually applied to an invoice is posted to the
    // ledger — an unapplied remainder (overpayment beyond total
    // outstanding) isn't recorded anywhere, consistent with the documented
    // "no supplier credit balance" limitation above.
    const appliedTotal = paymentAmount - remaining;
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
