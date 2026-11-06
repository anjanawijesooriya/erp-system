import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@erp/db";
import { journalEntries, ledgerAccounts } from "@erp/db/schema";
import { postJournalEntry } from "./journal";

/**
 * A thin, shop-owner-facing layer over the journal (build-plan rule #1:
 * `postJournalEntry` stays the single writer — this never touches
 * `journal_entries` directly). Where the manual journal screen asks for
 * raw debit/credit lines and an account code, this asks the one question
 * an owner actually has: "what did I spend, on what, paid from where" —
 * and turns that into the correct two-line entry itself.
 */
export const expenseInput = z.object({
  branchId: z.string().uuid(),
  expenseDate: z.string().min(1),
  accountCode: z.string().min(1),
  amount: z.coerce.number().positive(),
  paidFrom: z.enum(["1000", "1010"]), // 1000 Cash in Hand, 1010 Bank
  description: z.string().min(1).max(300),
});
export type ExpenseInput = z.infer<typeof expenseInput>;

export async function recordExpense(tenantId: string, userId: string, input: ExpenseInput) {
  return db.transaction((tx) =>
    postJournalEntry(tx, {
      tenantId,
      branchId: input.branchId,
      entryDate: input.expenseDate,
      referenceType: "expense",
      createdByUserId: userId,
      memo: input.description,
      lines: [
        { accountCode: input.accountCode, debit: input.amount, description: input.description },
        { accountCode: input.paidFrom, credit: input.amount, description: input.description },
      ],
    }),
  );
}

/**
 * Expense-type accounts this form offers, kept in sync with whatever
 * accounts actually exist rather than a hardcoded list — minus
 * system-owned ones like Cost of Goods Sold, which auto-posts from sales
 * and would corrupt margin reporting if manually poked here.
 */
export async function listExpenseAccounts(tenantId: string) {
  return db.query.ledgerAccounts.findMany({
    where: and(eq(ledgerAccounts.tenantId, tenantId), eq(ledgerAccounts.type, "expense"), eq(ledgerAccounts.isSystemAccount, false)),
    orderBy: (a, { asc }) => [asc(a.code)],
  });
}

/** Expenses recorded through this screen specifically — journal entries tagged `referenceType: "expense"`, not every expense-type posting (COGS from a sale, payroll, etc. use their own reference types). */
export async function listExpenses(tenantId: string) {
  return db.query.journalEntries.findMany({
    where: and(eq(journalEntries.tenantId, tenantId), eq(journalEntries.referenceType, "expense")),
    orderBy: [desc(journalEntries.entryDate), desc(journalEntries.createdAt)],
    with: { lines: { with: { account: true } }, branch: true },
  });
}
