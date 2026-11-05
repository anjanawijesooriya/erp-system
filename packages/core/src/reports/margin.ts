import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@erp/db";
import { productVariants, products, salesInvoiceLines, salesInvoices, stockMovements } from "@erp/db/schema";
import type { DateRange } from "./sales";

export interface MarginRow {
  productVariantId: string;
  sku: string;
  productName: string;
  revenue: string;
  cogs: string;
  margin: string;
  marginPct: string;
}

/**
 * Revenue comes from invoiced sales (sales_invoice_lines); cost comes from
 * "sales" stock movements (the delivery event) in the same range. These
 * aren't joined transaction-by-transaction — a delivery can happen on a
 * different day than its invoice — so this is a per-product aggregate
 * margin for the period, not a per-sale one. Good enough for a margin
 * report; not meant to reconcile line-for-line against a single invoice.
 */
export async function getMarginByProduct(tenantId: string, range: DateRange): Promise<MarginRow[]> {
  const revenueRows = await db
    .select({
      productVariantId: productVariants.id,
      sku: productVariants.sku,
      productName: products.name,
      revenue: sql<string>`coalesce(sum(${salesInvoiceLines.lineTotal}), 0)`,
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
    .groupBy(productVariants.id, productVariants.sku, products.name);

  const costRows = await db
    .select({
      productVariantId: stockMovements.productVariantId,
      cogs: sql<string>`coalesce(sum(${stockMovements.quantity} * ${stockMovements.unitCost}), 0)`,
    })
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.tenantId, tenantId),
        eq(stockMovements.movementType, "sales"),
        gte(sql<string>`${stockMovements.createdAt}::date`, range.from),
        lte(sql<string>`${stockMovements.createdAt}::date`, range.to),
      ),
    )
    .groupBy(stockMovements.productVariantId);

  const costByVariant = new Map(costRows.map((r) => [r.productVariantId, Number(r.cogs)]));

  return revenueRows
    .map((r) => {
      const revenue = Number(r.revenue);
      const cogs = costByVariant.get(r.productVariantId) ?? 0;
      const margin = revenue - cogs;
      return {
        productVariantId: r.productVariantId,
        sku: r.sku,
        productName: r.productName,
        revenue: revenue.toFixed(2),
        cogs: cogs.toFixed(2),
        margin: margin.toFixed(2),
        marginPct: revenue > 0 ? ((margin / revenue) * 100).toFixed(1) : "0.0",
      };
    })
    .sort((a, b) => Number(b.margin) - Number(a.margin));
}
