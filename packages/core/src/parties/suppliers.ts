import { and, eq, sql } from "drizzle-orm";
import { db } from "@erp/db";
import { suppliers, supplierInvoices, supplierInvoiceLines, supplierPaymentAllocations } from "@erp/db/schema";
import type { PartyInput } from "./schemas";

export async function listSuppliers(tenantId: string) {
  return db.query.suppliers.findMany({
    where: eq(suppliers.tenantId, tenantId),
    orderBy: (s, { asc }) => [asc(s.name)],
  });
}

/** Suppliers with their lifetime purchases total and current outstanding balance — what the "People & suppliers" list shows per row. */
export async function listSuppliersWithStats(tenantId: string) {
  const rows = await db.query.suppliers.findMany({
    where: eq(suppliers.tenantId, tenantId),
    orderBy: (s, { asc }) => [asc(s.name)],
  });
  if (rows.length === 0) return [];

  const purchaseTotals = await db
    .select({
      supplierId: supplierInvoices.supplierId,
      total: sql<string>`coalesce(sum(${supplierInvoiceLines.lineTotal}), 0)`,
    })
    .from(supplierInvoices)
    .innerJoin(supplierInvoiceLines, eq(supplierInvoiceLines.invoiceId, supplierInvoices.id))
    .where(and(eq(supplierInvoices.tenantId, tenantId), sql`${supplierInvoices.status} <> 'cancelled'`))
    .groupBy(supplierInvoices.supplierId);

  const balances = await db
    .select({
      supplierId: supplierInvoices.supplierId,
      totalAmount: sql<string>`coalesce(sum(${supplierInvoices.totalAmount}), 0)`,
      applied: sql<string>`coalesce(sum(${supplierPaymentAllocations.amountApplied}), 0)`,
    })
    .from(supplierInvoices)
    .leftJoin(supplierPaymentAllocations, eq(supplierPaymentAllocations.invoiceId, supplierInvoices.id))
    .where(and(eq(supplierInvoices.tenantId, tenantId), sql`${supplierInvoices.status} not in ('paid', 'cancelled')`))
    .groupBy(supplierInvoices.supplierId);

  const purchaseMap = new Map(purchaseTotals.map((r) => [r.supplierId, Number(r.total)]));
  const balanceMap = new Map(balances.map((r) => [r.supplierId, Number(r.totalAmount) - Number(r.applied)]));

  return rows.map((s) => ({
    ...s,
    totalPurchases: purchaseMap.get(s.id) ?? 0,
    balance: balanceMap.get(s.id) ?? 0,
  }));
}

export async function createSupplier(tenantId: string, input: PartyInput) {
  const [row] = await db
    .insert(suppliers)
    .values({
      tenantId,
      code: input.code,
      name: input.name,
      phone: input.phone,
      email: input.email || undefined,
      address: input.address,
      taxId: input.taxId,
      creditLimit: input.creditLimit.toString(),
      creditTermDays: input.creditTermDays,
    })
    .returning();
  return row;
}
