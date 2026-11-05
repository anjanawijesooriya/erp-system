import { and, eq, sql } from "drizzle-orm";
import { db } from "@erp/db";
import { suppliers, supplierInvoices, supplierPaymentAllocations } from "@erp/db/schema";
import { agingBucketFor, type AgingBucket } from "../aging";

export interface PayablesAgingRow {
  invoiceId: string;
  docNumber: string;
  supplierName: string;
  dueDate: string;
  totalAmount: string;
  amountDue: string;
  daysPastDue: number;
  bucket: AgingBucket;
}

/** One row per outstanding (unpaid or partially paid) supplier invoice, bucketed by days past due. */
export async function listPayablesAging(tenantId: string): Promise<PayablesAgingRow[]> {
  const rows = await db
    .select({
      invoiceId: supplierInvoices.id,
      docNumber: supplierInvoices.docNumber,
      supplierName: suppliers.name,
      dueDate: supplierInvoices.dueDate,
      totalAmount: supplierInvoices.totalAmount,
      applied: sql<string>`coalesce(sum(${supplierPaymentAllocations.amountApplied}), 0)`,
    })
    .from(supplierInvoices)
    .innerJoin(suppliers, eq(suppliers.id, supplierInvoices.supplierId))
    .leftJoin(supplierPaymentAllocations, eq(supplierPaymentAllocations.invoiceId, supplierInvoices.id))
    .where(
      and(
        eq(supplierInvoices.tenantId, tenantId),
        sql`${supplierInvoices.status} not in ('paid', 'cancelled')`,
      ),
    )
    .groupBy(supplierInvoices.id, suppliers.name);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return rows
    .map((r) => {
      const amountDue = Number(r.totalAmount) - Number(r.applied);
      const dueDate = new Date(r.dueDate);
      const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / 86_400_000);
      return {
        invoiceId: r.invoiceId,
        docNumber: r.docNumber,
        supplierName: r.supplierName,
        dueDate: r.dueDate,
        totalAmount: r.totalAmount,
        amountDue: amountDue.toFixed(2),
        daysPastDue,
        bucket: agingBucketFor(daysPastDue),
      };
    })
    .filter((r) => Number(r.amountDue) > 0.0001)
    .sort((a, b) => b.daysPastDue - a.daysPastDue);
}
