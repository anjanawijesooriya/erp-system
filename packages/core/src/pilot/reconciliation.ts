import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@erp/db";
import { pilotReconciliationEntries, stockBalances } from "@erp/db/schema";
import { getSalesByDay } from "../reports/sales";
import { getTrialBalance } from "../accounting/reports";

export const reconciliationEntryInput = z.object({
  branchId: z.string().uuid(),
  entryDate: z.string().min(1),
  metric: z.enum(["sales", "cash", "stock_value"]),
  manualValue: z.coerce.number(),
  note: z.string().max(500).optional(),
});
export type ReconciliationEntryInput = z.infer<typeof reconciliationEntryInput>;

export async function recordReconciliationEntry(
  tenantId: string,
  userId: string,
  input: ReconciliationEntryInput,
) {
  const [row] = await db
    .insert(pilotReconciliationEntries)
    .values({
      tenantId,
      branchId: input.branchId,
      entryDate: input.entryDate,
      metric: input.metric,
      manualValue: input.manualValue.toString(),
      note: input.note,
      createdByUserId: userId,
    })
    .returning();
  return row;
}

export async function listReconciliationEntries(tenantId: string) {
  return db.query.pilotReconciliationEntries.findMany({
    where: eq(pilotReconciliationEntries.tenantId, tenantId),
    orderBy: [desc(pilotReconciliationEntries.entryDate)],
    with: { branch: true },
  });
}

export interface ReconciliationRow {
  entryDate: string;
  metric: "sales" | "cash" | "stock_value";
  systemValue: string;
  manualValue: string;
  variance: string;
  note: string | null;
}

/** The system-computed side of each entered reconciliation row, joined and diffed against the manual figure. */
export async function getReconciliationComparison(tenantId: string): Promise<ReconciliationRow[]> {
  const entries = await db.query.pilotReconciliationEntries.findMany({
    where: eq(pilotReconciliationEntries.tenantId, tenantId),
    orderBy: [desc(pilotReconciliationEntries.entryDate)],
  });

  const rows: ReconciliationRow[] = [];
  for (const entry of entries) {
    let systemValue = 0;

    if (entry.metric === "sales") {
      const [dayRow] = await getSalesByDay(tenantId, { from: entry.entryDate, to: entry.entryDate });
      systemValue = Number(dayRow?.totalSales ?? 0);
    } else if (entry.metric === "cash") {
      const tb = await getTrialBalance(tenantId, { to: entry.entryDate });
      systemValue = Number(tb.find((r) => r.accountCode === "1000")?.balance ?? 0);
    } else {
      // stock_balances is a running total, not a historical snapshot table
      // (see Phase 3 design notes), so this is always the *current* stock
      // value regardless of the entry's date — only meaningful to compare
      // against a manual count taken today, not a past date.
      const balances = await db
        .select()
        .from(stockBalances)
        .where(and(eq(stockBalances.tenantId, tenantId)));
      systemValue = balances.reduce((sum, b) => sum + Number(b.quantity) * Number(b.averageCost), 0);
    }

    const manualValue = Number(entry.manualValue);
    rows.push({
      entryDate: entry.entryDate,
      metric: entry.metric,
      systemValue: systemValue.toFixed(2),
      manualValue: manualValue.toFixed(2),
      variance: (systemValue - manualValue).toFixed(2),
      note: entry.note,
    });
  }

  return rows;
}
