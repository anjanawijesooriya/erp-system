import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@erp/db";
import { cashRegisterSessions, salesPayments } from "@erp/db/schema";

export class RegisterAlreadyOpenError extends Error {
  constructor() {
    super("A cash register session is already open for this branch");
    this.name = "RegisterAlreadyOpenError";
  }
}

export class NoOpenRegisterError extends Error {
  constructor() {
    super("No open cash register session for this branch");
    this.name = "NoOpenRegisterError";
  }
}

export async function getOpenRegisterSession(tenantId: string, branchId: string) {
  return db.query.cashRegisterSessions.findFirst({
    where: and(eq(cashRegisterSessions.tenantId, tenantId), eq(cashRegisterSessions.branchId, branchId), eq(cashRegisterSessions.status, "open")),
    with: { openedBy: true },
  });
}

/** Sum of cash-method sales_payments recorded since `since` for this branch — what the drawer should have picked up. */
async function getCashCollectedSince(tenantId: string, branchId: string, since: Date) {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${salesPayments.amount}), 0)` })
    .from(salesPayments)
    .where(
      and(
        eq(salesPayments.tenantId, tenantId),
        eq(salesPayments.branchId, branchId),
        eq(salesPayments.method, "cash"),
        gte(salesPayments.createdAt, since),
      ),
    );
  return Number(row?.total ?? 0);
}

export async function openRegister(tenantId: string, branchId: string, userId: string, openingBalance: number, note?: string) {
  return db.transaction(async (tx) => {
    const existing = await tx.query.cashRegisterSessions.findFirst({
      where: and(eq(cashRegisterSessions.tenantId, tenantId), eq(cashRegisterSessions.branchId, branchId), eq(cashRegisterSessions.status, "open")),
    });
    if (existing) throw new RegisterAlreadyOpenError();

    const [session] = await tx
      .insert(cashRegisterSessions)
      .values({ tenantId, branchId, openedByUserId: userId, openingBalance: openingBalance.toString(), openingNote: note })
      .returning();
    return session;
  });
}

export async function closeRegister(
  tenantId: string,
  branchId: string,
  userId: string,
  countedBalance: number,
  note?: string,
) {
  return db.transaction(async (tx) => {
    const session = await tx.query.cashRegisterSessions.findFirst({
      where: and(eq(cashRegisterSessions.tenantId, tenantId), eq(cashRegisterSessions.branchId, branchId), eq(cashRegisterSessions.status, "open")),
    });
    if (!session) throw new NoOpenRegisterError();

    const cashCollected = await getCashCollectedSince(tenantId, branchId, session.openedAt);
    const expected = Number(session.openingBalance) + cashCollected;
    const variance = countedBalance - expected;

    const [closed] = await tx
      .update(cashRegisterSessions)
      .set({
        status: "closed",
        expectedClosingBalance: expected.toString(),
        closingCountedBalance: countedBalance.toString(),
        variance: variance.toString(),
        closingNote: note,
        closedByUserId: userId,
        closedAt: new Date(),
      })
      .where(eq(cashRegisterSessions.id, session.id))
      .returning();
    return closed;
  });
}

export async function listRegisterSessions(tenantId: string, branchId?: string) {
  return db.query.cashRegisterSessions.findMany({
    where: and(eq(cashRegisterSessions.tenantId, tenantId), branchId ? eq(cashRegisterSessions.branchId, branchId) : undefined),
    with: { branch: true, openedBy: true, closedBy: true },
    orderBy: (s, { desc }) => [desc(s.openedAt)],
    limit: 50,
  });
}
