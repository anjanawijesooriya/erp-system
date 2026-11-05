import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@erp/db";
import {
  bankReconciliationItems,
  bankReconciliations,
  journalEntries,
  journalEntryLines,
  ledgerAccounts,
} from "@erp/db/schema";

export async function listBankAccountTransactions(tenantId: string, bankAccountCode = "1010") {
  const reconciledLineIds = await db
    .select({ journalEntryLineId: bankReconciliationItems.journalEntryLineId })
    .from(bankReconciliationItems)
    .innerJoin(bankReconciliations, eq(bankReconciliations.id, bankReconciliationItems.reconciliationId))
    .where(eq(bankReconciliations.tenantId, tenantId));
  const reconciledSet = new Set(reconciledLineIds.map((r) => r.journalEntryLineId));

  const rows = await db
    .select({
      lineId: journalEntryLines.id,
      entryDate: journalEntries.entryDate,
      docNumber: journalEntries.docNumber,
      memo: journalEntries.memo,
      referenceType: journalEntries.referenceType,
      debit: journalEntryLines.debit,
      credit: journalEntryLines.credit,
    })
    .from(journalEntryLines)
    .innerJoin(journalEntries, eq(journalEntries.id, journalEntryLines.journalEntryId))
    .innerJoin(ledgerAccounts, eq(ledgerAccounts.id, journalEntryLines.accountId))
    .where(and(eq(ledgerAccounts.tenantId, tenantId), eq(ledgerAccounts.code, bankAccountCode)))
    .orderBy(journalEntries.entryDate);

  return rows.map((r) => ({ ...r, isReconciled: reconciledSet.has(r.lineId) }));
}

export const reconciliationInput = z.object({
  bankAccountCode: z.string().min(1).default("1010"),
  statementDate: z.string().min(1),
  statementBalance: z.coerce.number(),
  clearedLineIds: z.array(z.string().uuid()).default([]),
});
export type ReconciliationInput = z.infer<typeof reconciliationInput>;

/**
 * MVP single-step flow: pick the statement balance and tick off which
 * transactions cleared, submit once. Completed immediately — no
 * separate "in progress" draft state.
 */
export async function completeReconciliation(
  tenantId: string,
  userId: string,
  input: ReconciliationInput,
) {
  return db.transaction(async (tx) => {
    const bankAccount = await tx.query.ledgerAccounts.findFirst({
      where: and(eq(ledgerAccounts.tenantId, tenantId), eq(ledgerAccounts.code, input.bankAccountCode)),
    });
    if (!bankAccount) throw new Error("Bank account not found");

    const [reconciliation] = await tx
      .insert(bankReconciliations)
      .values({
        tenantId,
        bankAccountId: bankAccount.id,
        statementDate: input.statementDate,
        statementBalance: input.statementBalance.toString(),
        isCompleted: true,
        createdByUserId: userId,
      })
      .returning();
    if (!reconciliation) throw new Error("Failed to create reconciliation");

    let clearedLines: { debit: string; credit: string }[] = [];
    if (input.clearedLineIds.length > 0) {
      for (const lineId of input.clearedLineIds) {
        await tx.insert(bankReconciliationItems).values({
          reconciliationId: reconciliation.id,
          journalEntryLineId: lineId,
        });
      }
      clearedLines = await tx
        .select({ debit: journalEntryLines.debit, credit: journalEntryLines.credit })
        .from(journalEntryLines)
        .where(inArray(journalEntryLines.id, input.clearedLineIds));
    }

    const clearedBalance = clearedLines.reduce((sum, l) => sum + Number(l.debit) - Number(l.credit), 0);
    const variance = input.statementBalance - clearedBalance;

    return { reconciliation, clearedBalance, variance };
  });
}

export async function listReconciliations(tenantId: string) {
  return db.query.bankReconciliations.findMany({
    where: eq(bankReconciliations.tenantId, tenantId),
    orderBy: [desc(bankReconciliations.statementDate)],
    with: { bankAccount: true, items: true },
  });
}
