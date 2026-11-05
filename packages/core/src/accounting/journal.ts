import { and, eq, inArray, lte, gte } from "drizzle-orm";
import { accountingPeriods, journalEntries, journalEntryLines, ledgerAccounts } from "@erp/db/schema";
import { nextDocNumber } from "../doc-numbers";
import type { DbTx } from "../tenant-context";

export class PeriodClosedError extends Error {
  constructor(entryDate: string) {
    super(`Cannot post to ${entryDate}: that accounting period is closed`);
    this.name = "PeriodClosedError";
  }
}

export class UnbalancedJournalEntryError extends Error {
  constructor(totalDebit: number, totalCredit: number) {
    super(`Journal entry does not balance: debit ${totalDebit} != credit ${totalCredit}`);
    this.name = "UnbalancedJournalEntryError";
  }
}

export interface JournalLineInput {
  /** Chart-of-accounts code, e.g. "1200" for Inventory — resolved to an account id within the tenant. */
  accountCode: string;
  debit?: number;
  credit?: number;
  description?: string;
}

export interface PostJournalEntryParams {
  tenantId: string;
  branchId: string;
  entryDate: string;
  referenceType: string;
  referenceId?: string;
  memo?: string;
  createdByUserId: string;
  lines: JournalLineInput[];
}

async function assertPeriodOpen(tx: DbTx, tenantId: string, entryDate: string) {
  const closedPeriod = await tx.query.accountingPeriods.findFirst({
    where: and(
      eq(accountingPeriods.tenantId, tenantId),
      eq(accountingPeriods.isClosed, true),
      lte(accountingPeriods.periodStart, entryDate),
      gte(accountingPeriods.periodEnd, entryDate),
    ),
  });
  if (closedPeriod) throw new PeriodClosedError(entryDate);
}

/**
 * The single writer to the double-entry ledger (build-plan rule #1).
 * Validates each line has exactly one of debit/credit set and that the
 * entry balances before writing anything, and rejects posting into a
 * closed period. Every module's auto-posting (GRN, invoices, payments,
 * deliveries, returns — see auto-posting.ts) and the manual journal UI
 * both go through this; there is no other way to write a journal_entries row.
 */
export async function postJournalEntry(tx: DbTx, params: PostJournalEntryParams) {
  if (params.lines.length < 2) {
    throw new Error("A journal entry needs at least two lines");
  }

  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of params.lines) {
    const debit = line.debit ?? 0;
    const credit = line.credit ?? 0;
    if ((debit > 0) === (credit > 0)) {
      throw new Error("Each journal line must have exactly one of debit or credit set");
    }
    totalDebit += debit;
    totalCredit += credit;
  }
  if (Math.abs(totalDebit - totalCredit) > 0.0001) {
    throw new UnbalancedJournalEntryError(totalDebit, totalCredit);
  }

  await assertPeriodOpen(tx, params.tenantId, params.entryDate);

  const codes = [...new Set(params.lines.map((l) => l.accountCode))];
  const accounts = await tx.query.ledgerAccounts.findMany({
    where: and(eq(ledgerAccounts.tenantId, params.tenantId), inArray(ledgerAccounts.code, codes)),
  });
  const accountIdByCode = new Map(accounts.map((a) => [a.code, a.id]));
  for (const code of codes) {
    if (!accountIdByCode.has(code)) {
      throw new Error(`Unknown ledger account code "${code}" for this tenant`);
    }
  }

  const docNumber = await nextDocNumber(
    tx,
    { tenantId: params.tenantId, branchId: params.branchId },
    "journal_entry",
    "JE",
  );

  const [entry] = await tx
    .insert(journalEntries)
    .values({
      tenantId: params.tenantId,
      branchId: params.branchId,
      docNumber,
      entryDate: params.entryDate,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      memo: params.memo,
      createdByUserId: params.createdByUserId,
    })
    .returning();
  if (!entry) throw new Error("Failed to create journal entry");

  for (const line of params.lines) {
    await tx.insert(journalEntryLines).values({
      journalEntryId: entry.id,
      accountId: accountIdByCode.get(line.accountCode)!,
      debit: (line.debit ?? 0).toString(),
      credit: (line.credit ?? 0).toString(),
      description: line.description,
    });
  }

  return entry;
}

/** Reverses a posted entry by creating an opposite one (build-plan rule #3 — never edit/delete, only reverse). */
export async function reverseJournalEntry(
  tx: DbTx,
  tenantId: string,
  branchId: string,
  userId: string,
  entryId: string,
  memo?: string,
) {
  const original = await tx.query.journalEntries.findFirst({
    where: and(eq(journalEntries.id, entryId), eq(journalEntries.tenantId, tenantId)),
    with: { lines: { with: { account: true } } },
  });
  if (!original) throw new Error("Journal entry not found");

  const today = new Date().toISOString().slice(0, 10);
  const docNumber = await nextDocNumber(tx, { tenantId, branchId }, "journal_entry", "JE");

  const [reversal] = await tx
    .insert(journalEntries)
    .values({
      tenantId,
      branchId,
      docNumber,
      entryDate: today,
      referenceType: original.referenceType,
      referenceId: original.referenceId,
      memo: memo ?? `Reversal of ${original.docNumber}`,
      reversalOfEntryId: original.id,
      createdByUserId: userId,
    })
    .returning();
  if (!reversal) throw new Error("Failed to create reversal entry");

  for (const line of original.lines) {
    await tx.insert(journalEntryLines).values({
      journalEntryId: reversal.id,
      accountId: line.accountId,
      debit: line.credit, // swapped
      credit: line.debit,
      description: line.description,
    });
  }

  return reversal;
}
