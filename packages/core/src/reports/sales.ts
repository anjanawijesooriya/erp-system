import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@erp/db";
import { customers, productVariants, products, salesInvoiceLines, salesInvoices } from "@erp/db/schema";

export interface DateRange {
  from: string;
  to: string;
}

/** Sales totals per calendar day, from invoiced amounts (not delivered — matches "sales" as billed). */
export async function getSalesByDay(tenantId: string, range: DateRange) {
  return db
    .select({
      day: salesInvoices.invoiceDate,
      invoiceCount: sql<number>`count(distinct ${salesInvoices.id})`,
      totalSales: sql<string>`coalesce(sum(${salesInvoiceLines.lineTotal}), 0)`,
    })
    .from(salesInvoices)
    .innerJoin(salesInvoiceLines, eq(salesInvoiceLines.invoiceId, salesInvoices.id))
    .where(
      and(
        eq(salesInvoices.tenantId, tenantId),
        gte(salesInvoices.invoiceDate, range.from),
        lte(salesInvoices.invoiceDate, range.to),
      ),
    )
    .groupBy(salesInvoices.invoiceDate)
    .orderBy(salesInvoices.invoiceDate);
}

export async function getTopProducts(tenantId: string, range: DateRange, limit = 10) {
  return db
    .select({
      productVariantId: productVariants.id,
      sku: productVariants.sku,
      productName: products.name,
      qtySold: sql<string>`coalesce(sum(${salesInvoiceLines.qty}), 0)`,
      totalRevenue: sql<string>`coalesce(sum(${salesInvoiceLines.lineTotal}), 0)`,
    })
    .from(salesInvoiceLines)
    .innerJoin(salesInvoices, eq(salesInvoices.id, salesInvoiceLines.invoiceId))
    .innerJoin(productVariants, eq(productVariants.id, salesInvoiceLines.productVariantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(
      and(
        eq(salesInvoices.tenantId, tenantId),
        gte(salesInvoices.invoiceDate, range.from),
        lte(salesInvoices.invoiceDate, range.to),
      ),
    )
    .groupBy(productVariants.id, productVariants.sku, products.name)
    .orderBy(sql`sum(${salesInvoiceLines.lineTotal}) desc`)
    .limit(limit);
}

export async function getTopCustomers(tenantId: string, range: DateRange, limit = 10) {
  return db
    .select({
      customerId: customers.id,
      customerName: customers.name,
      invoiceCount: sql<number>`count(distinct ${salesInvoices.id})`,
      totalRevenue: sql<string>`coalesce(sum(${salesInvoiceLines.lineTotal}), 0)`,
    })
    .from(salesInvoiceLines)
    .innerJoin(salesInvoices, eq(salesInvoices.id, salesInvoiceLines.invoiceId))
    .innerJoin(customers, eq(customers.id, salesInvoices.customerId))
    .where(
      and(
        eq(salesInvoices.tenantId, tenantId),
        gte(salesInvoices.invoiceDate, range.from),
        lte(salesInvoices.invoiceDate, range.to),
      ),
    )
    .groupBy(customers.id, customers.name)
    .orderBy(sql`sum(${salesInvoiceLines.lineTotal}) desc`)
    .limit(limit);
}
