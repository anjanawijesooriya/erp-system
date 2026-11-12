import { postJournalEntry } from "./journal";
import type { DbTx } from "../tenant-context";

type Ctx = { tenantId: string; branchId: string; userId: string };

/** GRN: goods physically received, not yet billed. Debit Inventory, credit the GRN clearing account. */
export async function postGrnJournal(
  tx: DbTx,
  ctx: Ctx,
  params: { grnId: string; receivedDate: string; totalCost: number },
) {
  if (params.totalCost <= 0) return;
  return postJournalEntry(tx, {
    tenantId: ctx.tenantId,
    branchId: ctx.branchId,
    entryDate: params.receivedDate,
    referenceType: "grn",
    referenceId: params.grnId,
    createdByUserId: ctx.userId,
    lines: [
      { accountCode: "1200", debit: params.totalCost, description: "GRN received" },
      { accountCode: "1250", credit: params.totalCost, description: "GRN received" },
    ],
  });
}

/**
 * Supplier invoice: if it references a GRN, the goods are already in
 * Inventory (debited there by the GRN) — this just converts the clearing
 * balance into a real payable. If there's no GRN (invoice entered
 * standalone), it debits Inventory directly instead.
 */
export async function postSupplierInvoiceJournal(
  tx: DbTx,
  ctx: Ctx,
  params: { invoiceId: string; invoiceDate: string; totalAmount: number; hasGrn: boolean },
) {
  if (params.totalAmount <= 0) return;
  const debitAccount = params.hasGrn ? "1250" : "1200";
  return postJournalEntry(tx, {
    tenantId: ctx.tenantId,
    branchId: ctx.branchId,
    entryDate: params.invoiceDate,
    referenceType: "supplier_invoice",
    referenceId: params.invoiceId,
    createdByUserId: ctx.userId,
    lines: [
      { accountCode: debitAccount, debit: params.totalAmount, description: "Supplier invoice" },
      { accountCode: "2000", credit: params.totalAmount, description: "Supplier invoice" },
    ],
  });
}

/** Reverses a previously-posted supplier invoice journal when the invoice is cancelled before any payment is applied — mirrors postSupplierInvoiceJournal's debit/credit. */
export async function postSupplierInvoiceCancellationJournal(
  tx: DbTx,
  ctx: Ctx,
  params: { invoiceId: string; cancelDate: string; totalAmount: number; hasGrn: boolean },
) {
  if (params.totalAmount <= 0) return;
  const creditAccount = params.hasGrn ? "1250" : "1200";
  return postJournalEntry(tx, {
    tenantId: ctx.tenantId,
    branchId: ctx.branchId,
    entryDate: params.cancelDate,
    referenceType: "supplier_invoice",
    referenceId: params.invoiceId,
    createdByUserId: ctx.userId,
    lines: [
      { accountCode: "2000", debit: params.totalAmount, description: "Supplier invoice cancelled" },
      { accountCode: creditAccount, credit: params.totalAmount, description: "Supplier invoice cancelled" },
    ],
  });
}

/**
 * Supplier payment: a cheque issued doesn't clear the bank immediately, so
 * it credits Post-Dated Cheques Payable instead of Bank — see cheques.ts
 * for what happens when that cheque later clears.
 */
export async function postSupplierPaymentJournal(
  tx: DbTx,
  ctx: Ctx,
  params: { paymentId: string; paymentDate: string; amount: number; method: "cash" | "bank" | "cheque" },
) {
  if (params.amount <= 0) return;
  const creditAccount = params.method === "cheque" ? "2200" : params.method === "bank" ? "1010" : "1000";
  return postJournalEntry(tx, {
    tenantId: ctx.tenantId,
    branchId: ctx.branchId,
    entryDate: params.paymentDate,
    referenceType: "supplier_payment",
    referenceId: params.paymentId,
    createdByUserId: ctx.userId,
    lines: [
      { accountCode: "2000", debit: params.amount, description: "Supplier payment" },
      { accountCode: creditAccount, credit: params.amount, description: "Supplier payment" },
    ],
  });
}

/** Purchase return: reduces both the payable and the inventory valuation, at the stock's cost basis. */
export async function postPurchaseReturnJournal(
  tx: DbTx,
  ctx: Ctx,
  params: { returnId: string; returnDate: string; totalCost: number },
) {
  if (params.totalCost <= 0) return;
  return postJournalEntry(tx, {
    tenantId: ctx.tenantId,
    branchId: ctx.branchId,
    entryDate: params.returnDate,
    referenceType: "purchase_return",
    referenceId: params.returnId,
    createdByUserId: ctx.userId,
    lines: [
      { accountCode: "2000", debit: params.totalCost, description: "Purchase return" },
      { accountCode: "1200", credit: params.totalCost, description: "Purchase return" },
    ],
  });
}

/** Sales invoice: bills the customer. Does not touch inventory/COGS — that's the delivery's job. */
export async function postSalesInvoiceJournal(
  tx: DbTx,
  ctx: Ctx,
  params: { invoiceId: string; invoiceDate: string; totalAmount: number },
) {
  if (params.totalAmount <= 0) return;
  return postJournalEntry(tx, {
    tenantId: ctx.tenantId,
    branchId: ctx.branchId,
    entryDate: params.invoiceDate,
    referenceType: "sales_invoice",
    referenceId: params.invoiceId,
    createdByUserId: ctx.userId,
    lines: [
      { accountCode: "1100", debit: params.totalAmount, description: "Sales invoice" },
      { accountCode: "4000", credit: params.totalAmount, description: "Sales invoice" },
    ],
  });
}

/** Reverses a previously-posted sales invoice journal when it's voided before any payment or delivery — mirrors postSalesInvoiceJournal's debit/credit. */
export async function postSalesInvoiceVoidJournal(
  tx: DbTx,
  ctx: Ctx,
  params: { invoiceId: string; voidDate: string; totalAmount: number },
) {
  if (params.totalAmount <= 0) return;
  return postJournalEntry(tx, {
    tenantId: ctx.tenantId,
    branchId: ctx.branchId,
    entryDate: params.voidDate,
    referenceType: "sales_invoice",
    referenceId: params.invoiceId,
    createdByUserId: ctx.userId,
    lines: [
      { accountCode: "4000", debit: params.totalAmount, description: "Sales invoice voided" },
      { accountCode: "1100", credit: params.totalAmount, description: "Sales invoice voided" },
    ],
  });
}

/** Delivery: goods physically leave the warehouse — this is what recognizes COGS, at the warehouse's WAC. */
export async function postDeliveryJournal(
  tx: DbTx,
  ctx: Ctx,
  params: { deliveryId: string; deliveryDate: string; totalCost: number },
) {
  if (params.totalCost <= 0) return;
  return postJournalEntry(tx, {
    tenantId: ctx.tenantId,
    branchId: ctx.branchId,
    entryDate: params.deliveryDate,
    referenceType: "delivery",
    referenceId: params.deliveryId,
    createdByUserId: ctx.userId,
    lines: [
      { accountCode: "5000", debit: params.totalCost, description: "Delivery" },
      { accountCode: "1200", credit: params.totalCost, description: "Delivery" },
    ],
  });
}

/** Sales payment (receipt): a received cheque sits in PDC Receivable until it clears — see cheques.ts. */
export async function postSalesPaymentJournal(
  tx: DbTx,
  ctx: Ctx,
  params: { paymentId: string; paymentDate: string; amount: number; method: "cash" | "bank" | "cheque" },
) {
  if (params.amount <= 0) return;
  const debitAccount = params.method === "cheque" ? "1300" : params.method === "bank" ? "1010" : "1000";
  return postJournalEntry(tx, {
    tenantId: ctx.tenantId,
    branchId: ctx.branchId,
    entryDate: params.paymentDate,
    referenceType: "sales_payment",
    referenceId: params.paymentId,
    createdByUserId: ctx.userId,
    lines: [
      { accountCode: debitAccount, debit: params.amount, description: "Customer receipt" },
      { accountCode: "1100", credit: params.amount, description: "Customer receipt" },
    ],
  });
}

/**
 * Sales return / credit note: two balanced sub-postings in one entry —
 * inventory comes back in at cost (reversing the original COGS), and the
 * customer's receivable is reduced by the credited value (through Sales
 * Returns & Allowances, a contra-revenue account, not Sales Revenue itself).
 */
export async function postSalesReturnJournal(
  tx: DbTx,
  ctx: Ctx,
  params: { returnId: string; returnDate: string; totalCost: number; totalCreditValue: number },
) {
  const lines = [];
  if (params.totalCost > 0) {
    lines.push(
      { accountCode: "1200", debit: params.totalCost, description: "Sales return (stock back)" },
      { accountCode: "5000", credit: params.totalCost, description: "Sales return (COGS reversal)" },
    );
  }
  if (params.totalCreditValue > 0) {
    lines.push(
      { accountCode: "4100", debit: params.totalCreditValue, description: "Sales return (credit note)" },
      { accountCode: "1100", credit: params.totalCreditValue, description: "Sales return (credit note)" },
    );
  }
  if (lines.length === 0) return;

  return postJournalEntry(tx, {
    tenantId: ctx.tenantId,
    branchId: ctx.branchId,
    entryDate: params.returnDate,
    referenceType: "sales_return",
    referenceId: params.returnId,
    createdByUserId: ctx.userId,
    lines,
  });
}
