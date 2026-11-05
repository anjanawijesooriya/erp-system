import { and, desc, eq } from "drizzle-orm";
import { db } from "@erp/db";
import { accountingPeriods } from "@erp/db/schema";

export async function listPeriods(tenantId: string) {
  return db.query.accountingPeriods.findMany({
    where: eq(accountingPeriods.tenantId, tenantId),
    orderBy: [desc(accountingPeriods.periodStart)],
  });
}

/**
 * Closes a period (build-plan rule: period locking). Once closed,
 * postJournalEntry rejects any entry dated inside it — see
 * assertPeriodOpen in journal.ts. There's no "reopen" — reopening a closed
 * period is a deliberate omission: it should be a rare, audited action,
 * not a one-click toggle, and isn't needed for the MVP.
 */
export async function closePeriod(
  tenantId: string,
  userId: string,
  periodStart: string,
  periodEnd: string,
) {
  const existing = await db.query.accountingPeriods.findFirst({
    where: and(
      eq(accountingPeriods.tenantId, tenantId),
      eq(accountingPeriods.periodStart, periodStart),
      eq(accountingPeriods.periodEnd, periodEnd),
    ),
  });

  if (existing) {
    const [row] = await db
      .update(accountingPeriods)
      .set({ isClosed: true, closedByUserId: userId, closedAt: new Date() })
      .where(eq(accountingPeriods.id, existing.id))
      .returning();
    return row;
  }

  const [row] = await db
    .insert(accountingPeriods)
    .values({
      tenantId,
      periodStart,
      periodEnd,
      isClosed: true,
      closedByUserId: userId,
      closedAt: new Date(),
    })
    .returning();
  return row;
}
