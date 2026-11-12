import { and, eq, sql } from "drizzle-orm";
import { db } from "@erp/db";
import { customers, salesInvoices, salesInvoiceLines, salesPaymentAllocations } from "@erp/db/schema";
import type { PartyInput } from "./schemas";

const WALK_IN_CUSTOMER_CODE = "WALK-IN";

export async function listCustomers(tenantId: string) {
  return db.query.customers.findMany({
    where: eq(customers.tenantId, tenantId),
    orderBy: (c, { asc }) => [asc(c.name)],
  });
}

/** Customers with their lifetime sales total and current outstanding balance — what the "People & suppliers" list shows per row. */
export async function listCustomersWithStats(tenantId: string) {
  const rows = await db.query.customers.findMany({
    where: eq(customers.tenantId, tenantId),
    orderBy: (c, { asc }) => [asc(c.name)],
  });
  if (rows.length === 0) return [];

  const salesTotals = await db
    .select({
      customerId: salesInvoices.customerId,
      total: sql<string>`coalesce(sum(${salesInvoiceLines.lineTotal}), 0)`,
    })
    .from(salesInvoices)
    .innerJoin(salesInvoiceLines, eq(salesInvoiceLines.invoiceId, salesInvoices.id))
    .where(and(eq(salesInvoices.tenantId, tenantId), sql`${salesInvoices.status} <> 'cancelled'`))
    .groupBy(salesInvoices.customerId);

  const balances = await db
    .select({
      customerId: salesInvoices.customerId,
      totalAmount: sql<string>`coalesce(sum(${salesInvoices.totalAmount}), 0)`,
      applied: sql<string>`coalesce(sum(${salesPaymentAllocations.amountApplied}), 0)`,
    })
    .from(salesInvoices)
    .leftJoin(salesPaymentAllocations, eq(salesPaymentAllocations.invoiceId, salesInvoices.id))
    .where(and(eq(salesInvoices.tenantId, tenantId), sql`${salesInvoices.status} not in ('paid', 'cancelled')`))
    .groupBy(salesInvoices.customerId);

  const salesMap = new Map(salesTotals.map((r) => [r.customerId, Number(r.total)]));
  const balanceMap = new Map(balances.map((r) => [r.customerId, Number(r.totalAmount) - Number(r.applied)]));

  return rows.map((c) => ({
    ...c,
    totalSales: salesMap.get(c.id) ?? 0,
    balance: balanceMap.get(c.id) ?? 0,
  }));
}

export async function createCustomer(tenantId: string, input: PartyInput) {
  const [row] = await db
    .insert(customers)
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

/**
 * POS sales always need a customer record (sales_invoices.customerId is
 * NOT NULL, to avoid nullable-customer branches throughout the sales
 * module) — a walk-in sale with no named customer is attributed to this
 * synthetic per-tenant record instead. 0 credit terms: a walk-in sale's
 * invoice is due the same day.
 */
export async function getOrCreateWalkInCustomer(tenantId: string) {
  const existing = await db.query.customers.findFirst({
    where: and(eq(customers.tenantId, tenantId), eq(customers.code, WALK_IN_CUSTOMER_CODE)),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(customers)
    .values({ tenantId, code: WALK_IN_CUSTOMER_CODE, name: "Walk-in Customer", creditTermDays: 0 })
    .returning();
  if (!created) throw new Error("Failed to create walk-in customer");
  return created;
}
