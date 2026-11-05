import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@erp/db";
import { tenants } from "@erp/db/schema";
import { getSalesByDay, getTopProducts } from "./sales";
import { listLowStock } from "../inventory/stock-levels";

export interface DailySummary {
  tenantName: string;
  date: string;
  totalSales: string;
  invoiceCount: number;
  topProduct: string | null;
  lowStockCount: number;
}

export async function computeDailySummary(tenantId: string, date: string): Promise<DailySummary> {
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
  if (!tenant) throw new Error("Tenant not found");

  const [dayRow] = await getSalesByDay(tenantId, { from: date, to: date });
  const [topProduct] = await getTopProducts(tenantId, { from: date, to: date }, 1);
  const lowStock = await listLowStock(tenantId);

  return {
    tenantName: tenant.name,
    date,
    totalSales: dayRow?.totalSales ?? "0.00",
    invoiceCount: dayRow?.invoiceCount ?? 0,
    topProduct: topProduct ? `${topProduct.productName} (${topProduct.qtySold})` : null,
    lowStockCount: lowStock.length,
  };
}

export function formatSummarySms(summary: DailySummary): string {
  const lines = [
    `${summary.tenantName} — ${summary.date}`,
    `Sales: ${summary.totalSales} (${summary.invoiceCount} invoices)`,
  ];
  if (summary.topProduct) lines.push(`Top: ${summary.topProduct}`);
  if (summary.lowStockCount > 0) lines.push(`Low stock: ${summary.lowStockCount} item(s)`);
  return lines.join(". ");
}

/** Tenants with an SMS recipient configured — only these get a daily summary sent. */
export async function listTenantsWithSmsEnabled() {
  return db.query.tenants.findMany({
    where: and(eq(tenants.isActive, true), isNotNull(tenants.ownerPhone)),
  });
}
