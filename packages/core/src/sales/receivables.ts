import { and, eq, sql } from "drizzle-orm";
import { db } from "@erp/db";
import { customers, salesInvoices, salesPaymentAllocations } from "@erp/db/schema";
import { agingBucketFor, type AgingBucket } from "../aging";

export interface ReceivablesAgingRow {
  invoiceId: string;
  docNumber: string;
  customerId: string;
  customerName: string;
  dueDate: string;
  totalAmount: string;
  amountDue: string;
  daysPastDue: number;
  bucket: AgingBucket;
}

/** One row per outstanding (unpaid or partially paid) sales invoice, bucketed by days past due. */
export async function listReceivablesAging(tenantId: string): Promise<ReceivablesAgingRow[]> {
  const rows = await db
    .select({
      invoiceId: salesInvoices.id,
      docNumber: salesInvoices.docNumber,
      customerId: salesInvoices.customerId,
      customerName: customers.name,
      dueDate: salesInvoices.dueDate,
      totalAmount: salesInvoices.totalAmount,
      applied: sql<string>`coalesce(sum(${salesPaymentAllocations.amountApplied}), 0)`,
    })
    .from(salesInvoices)
    .innerJoin(customers, eq(customers.id, salesInvoices.customerId))
    .leftJoin(salesPaymentAllocations, eq(salesPaymentAllocations.invoiceId, salesInvoices.id))
    .where(
      and(eq(salesInvoices.tenantId, tenantId), sql`${salesInvoices.status} not in ('paid', 'cancelled')`),
    )
    .groupBy(salesInvoices.id, salesInvoices.customerId, customers.name);

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
        customerId: r.customerId,
        customerName: r.customerName,
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
