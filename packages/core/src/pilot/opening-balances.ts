import { and, eq } from "drizzle-orm";
import { db } from "@erp/db";
import {
  customers,
  productVariants,
  products,
  salesInvoiceLines,
  salesInvoices,
  suppliers,
  supplierInvoiceLines,
  supplierInvoices,
  unitsOfMeasure,
} from "@erp/db/schema";
import { postMovement } from "../inventory/movements";
import { postJournalEntry } from "../accounting/journal";
import { nextDocNumber } from "../doc-numbers";
import type { DbTx } from "../tenant-context";

/**
 * All three opening-balance postings share one offsetting account —
 * Opening Balance Equity (3800) — instead of Sales Revenue / COGS, since
 * these aren't current-period transactions. Each one is deliberately NOT
 * routed through the ordinary createSalesInvoice/createSupplierInvoice/
 * createGrn functions, because those post to Sales Revenue / Accounts
 * Payable via the GRN-clearing account — correct for a real transaction,
 * wrong for establishing where the books already stood on go-live day.
 */

async function getOrCreateOpeningBalanceVariant(tx: DbTx, tenantId: string) {
  const existing = await tx.query.productVariants.findFirst({
    where: and(eq(productVariants.tenantId, tenantId), eq(productVariants.sku, "OPENING-BAL")),
  });
  if (existing) return existing;

  let baseUom = await tx.query.unitsOfMeasure.findFirst({
    where: (u, { and: andOp, eq: eqOp }) => andOp(eqOp(u.tenantId, tenantId), eqOp(u.code, "EA")),
  });
  if (!baseUom) {
    const [created] = await tx
      .insert(unitsOfMeasure)
      .values({ tenantId, code: "EA", name: "Each" })
      .returning();
    baseUom = created;
  }

  const [product] = await tx
    .insert(products)
    .values({
      tenantId,
      sku: "OPENING-BAL",
      name: "Opening Balance (system)",
      baseUomId: baseUom!.id,
    })
    .returning();

  const [variant] = await tx
    .insert(productVariants)
    .values({ tenantId, productId: product!.id, sku: "OPENING-BAL", name: "Default" })
    .returning();

  return variant!;
}

export interface OpeningCustomerBalance {
  customerId: string;
  amount: number;
}

/** Establishes a customer's existing outstanding balance as a real, agable sales invoice. */
export async function postOpeningCustomerBalances(
  tenantId: string,
  userId: string,
  branchId: string,
  asOfDate: string,
  balances: OpeningCustomerBalance[],
) {
  return db.transaction(async (tx) => {
    const variant = await getOrCreateOpeningBalanceVariant(tx, tenantId);
    let totalPosted = 0;

    for (const b of balances) {
      if (b.amount <= 0) continue;
      const customer = await tx.query.customers.findFirst({
        where: and(eq(customers.id, b.customerId), eq(customers.tenantId, tenantId)),
      });
      if (!customer) continue;

      const dueDate = new Date(asOfDate);
      dueDate.setDate(dueDate.getDate() + customer.creditTermDays);

      const docNumber = await nextDocNumber(tx, { tenantId, branchId }, "sales_invoice", "INV");
      const [invoice] = await tx
        .insert(salesInvoices)
        .values({
          tenantId,
          branchId,
          customerId: b.customerId,
          docNumber,
          invoiceDate: asOfDate,
          dueDate: dueDate.toISOString().slice(0, 10),
          totalAmount: b.amount.toString(),
          createdByUserId: userId,
        })
        .returning();
      if (!invoice) continue;

      await tx.insert(salesInvoiceLines).values({
        invoiceId: invoice.id,
        productVariantId: variant.id,
        qty: "1",
        unitPrice: b.amount.toString(),
        lineTotal: b.amount.toString(),
      });

      totalPosted += b.amount;
    }

    if (totalPosted > 0) {
      await postJournalEntry(tx, {
        tenantId,
        branchId,
        entryDate: asOfDate,
        referenceType: "opening_balance",
        createdByUserId: userId,
        memo: "Opening customer balances",
        lines: [
          { accountCode: "1100", debit: totalPosted, description: "Opening customer balances" },
          { accountCode: "3800", credit: totalPosted, description: "Opening customer balances" },
        ],
      });
    }

    return { totalPosted, count: balances.length };
  });
}

export interface OpeningSupplierBalance {
  supplierId: string;
  amount: number;
}

/** Establishes a supplier's existing outstanding balance as a real, agable supplier invoice. */
export async function postOpeningSupplierBalances(
  tenantId: string,
  userId: string,
  branchId: string,
  asOfDate: string,
  balances: OpeningSupplierBalance[],
) {
  return db.transaction(async (tx) => {
    const variant = await getOrCreateOpeningBalanceVariant(tx, tenantId);
    let totalPosted = 0;

    for (const b of balances) {
      if (b.amount <= 0) continue;
      const supplier = await tx.query.suppliers.findFirst({
        where: and(eq(suppliers.id, b.supplierId), eq(suppliers.tenantId, tenantId)),
      });
      if (!supplier) continue;

      const dueDate = new Date(asOfDate);
      dueDate.setDate(dueDate.getDate() + supplier.creditTermDays);

      const docNumber = await nextDocNumber(tx, { tenantId, branchId }, "supplier_invoice", "SINV");
      const [invoice] = await tx
        .insert(supplierInvoices)
        .values({
          tenantId,
          branchId,
          supplierId: b.supplierId,
          docNumber,
          invoiceDate: asOfDate,
          dueDate: dueDate.toISOString().slice(0, 10),
          totalAmount: b.amount.toString(),
          createdByUserId: userId,
        })
        .returning();
      if (!invoice) continue;

      await tx.insert(supplierInvoiceLines).values({
        invoiceId: invoice.id,
        productVariantId: variant.id,
        qty: "1",
        unitCost: b.amount.toString(),
        lineTotal: b.amount.toString(),
      });

      totalPosted += b.amount;
    }

    if (totalPosted > 0) {
      await postJournalEntry(tx, {
        tenantId,
        branchId,
        entryDate: asOfDate,
        referenceType: "opening_balance",
        createdByUserId: userId,
        memo: "Opening supplier balances",
        lines: [
          { accountCode: "3800", debit: totalPosted, description: "Opening supplier balances" },
          { accountCode: "2000", credit: totalPosted, description: "Opening supplier balances" },
        ],
      });
    }

    return { totalPosted, count: balances.length };
  });
}

export interface OpeningStockBalance {
  warehouseId: string;
  productVariantId: string;
  quantity: number;
  unitCost: number;
  batchNumber?: string;
  expiryDate?: string;
}

/** Establishes existing stock on hand via the normal movement ledger (rule #2) — never a direct balance edit. */
export async function postOpeningStockBalances(
  tenantId: string,
  userId: string,
  branchId: string,
  asOfDate: string,
  balances: OpeningStockBalance[],
) {
  return db.transaction(async (tx) => {
    let totalCost = 0;

    for (const b of balances) {
      if (b.quantity <= 0) continue;
      await postMovement(tx, {
        tenantId,
        warehouseId: b.warehouseId,
        productVariantId: b.productVariantId,
        movementType: "opening_balance",
        direction: "in",
        quantity: b.quantity,
        unitCost: b.unitCost,
        batchNumber: b.batchNumber,
        expiryDate: b.expiryDate,
        referenceType: "opening_balance",
        createdByUserId: userId,
      });
      totalCost += b.quantity * b.unitCost;
    }

    if (totalCost > 0) {
      await postJournalEntry(tx, {
        tenantId,
        branchId,
        entryDate: asOfDate,
        referenceType: "opening_balance",
        createdByUserId: userId,
        memo: "Opening stock balances",
        lines: [
          { accountCode: "1200", debit: totalCost, description: "Opening stock balances" },
          { accountCode: "3800", credit: totalCost, description: "Opening stock balances" },
        ],
      });
    }

    return { totalCost, count: balances.length };
  });
}
