import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@erp/db";
import { journalEntries, journalEntryLines, ledgerAccounts } from "@erp/db/schema";

export interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  type: string;
  totalDebit: string;
  totalCredit: string;
  balance: string; // debit-normal accounts (asset/expense) positive when debit > credit, credit-normal otherwise
}

const DEBIT_NORMAL_TYPES = new Set(["asset", "expense"]);

/** Sums every journal line by account, optionally within [from, to] (inclusive). Unposted-to accounts are omitted. */
export async function getTrialBalance(
  tenantId: string,
  range?: { from?: string; to?: string },
): Promise<TrialBalanceRow[]> {
  const rows = await db
    .select({
      code: ledgerAccounts.code,
      name: ledgerAccounts.name,
      type: ledgerAccounts.type,
      totalDebit: sql<string>`coalesce(sum(${journalEntryLines.debit}), 0)`,
      totalCredit: sql<string>`coalesce(sum(${journalEntryLines.credit}), 0)`,
    })
    .from(journalEntryLines)
    .innerJoin(journalEntries, eq(journalEntries.id, journalEntryLines.journalEntryId))
    .innerJoin(ledgerAccounts, eq(ledgerAccounts.id, journalEntryLines.accountId))
    .where(
      and(
        eq(ledgerAccounts.tenantId, tenantId),
        range?.from ? gte(journalEntries.entryDate, range.from) : undefined,
        range?.to ? lte(journalEntries.entryDate, range.to) : undefined,
      ),
    )
    .groupBy(ledgerAccounts.code, ledgerAccounts.name, ledgerAccounts.type)
    .orderBy(ledgerAccounts.code);

  return rows.map((r) => {
    const debit = Number(r.totalDebit);
    const credit = Number(r.totalCredit);
    const balance = DEBIT_NORMAL_TYPES.has(r.type) ? debit - credit : credit - debit;
    return {
      accountCode: r.code,
      accountName: r.name,
      type: r.type,
      totalDebit: debit.toFixed(2),
      totalCredit: credit.toFixed(2),
      balance: balance.toFixed(2),
    };
  });
}

export interface ProfitAndLossResult {
  income: { accountCode: string; accountName: string; amount: string }[];
  expenses: { accountCode: string; accountName: string; amount: string }[];
  totalIncome: string;
  totalExpenses: string;
  netProfit: string;
}

/** Income and expense activity within [from, to] — a period P&L, not a running balance. */
export async function getProfitAndLoss(
  tenantId: string,
  range: { from: string; to: string },
): Promise<ProfitAndLossResult> {
  const trialBalance = await getTrialBalance(tenantId, range);

  const income = trialBalance
    .filter((r) => r.type === "income")
    .map((r) => ({ accountCode: r.accountCode, accountName: r.accountName, amount: r.balance }));
  const expenses = trialBalance
    .filter((r) => r.type === "expense")
    .map((r) => ({ accountCode: r.accountCode, accountName: r.accountName, amount: r.balance }));

  const totalIncome = income.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalExpenses = expenses.reduce((sum, r) => sum + Number(r.amount), 0);

  return {
    income,
    expenses,
    totalIncome: totalIncome.toFixed(2),
    totalExpenses: totalExpenses.toFixed(2),
    netProfit: (totalIncome - totalExpenses).toFixed(2),
  };
}

export interface BalanceSheetResult {
  assets: { accountCode: string; accountName: string; amount: string }[];
  liabilities: { accountCode: string; accountName: string; amount: string }[];
  equity: { accountCode: string; accountName: string; amount: string }[];
  totalAssets: string;
  totalLiabilities: string;
  totalEquity: string;
  /** Net income since inception, not yet rolled into Retained Earnings by a period-close entry. */
  unclosedNetIncome: string;
}

/**
 * As-of-date snapshot. There's no period-close entry that rolls P&L into
 * Retained Earnings (closePeriod only locks the period against new
 * postings — see periods.ts), so cumulative net income is surfaced as its
 * own equity line instead; assets should equal liabilities + equity +
 * unclosedNetIncome.
 */
export async function getBalanceSheet(tenantId: string, asOf: string): Promise<BalanceSheetResult> {
  const trialBalance = await getTrialBalance(tenantId, { to: asOf });

  const assets = trialBalance
    .filter((r) => r.type === "asset")
    .map((r) => ({ accountCode: r.accountCode, accountName: r.accountName, amount: r.balance }));
  const liabilities = trialBalance
    .filter((r) => r.type === "liability")
    .map((r) => ({ accountCode: r.accountCode, accountName: r.accountName, amount: r.balance }));
  const equity = trialBalance
    .filter((r) => r.type === "equity")
    .map((r) => ({ accountCode: r.accountCode, accountName: r.accountName, amount: r.balance }));

  const totalAssets = assets.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalLiabilities = liabilities.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalEquity = equity.reduce((sum, r) => sum + Number(r.amount), 0);

  const income = trialBalance.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.balance), 0);
  const expense = trialBalance.filter((r) => r.type === "expense").reduce((s, r) => s + Number(r.balance), 0);

  return {
    assets,
    liabilities,
    equity,
    totalAssets: totalAssets.toFixed(2),
    totalLiabilities: totalLiabilities.toFixed(2),
    totalEquity: totalEquity.toFixed(2),
    unclosedNetIncome: (income - expense).toFixed(2),
  };
}

export interface MonthlyFinancialRow {
  month: string; // "YYYY-MM"
  revenue: number;
  expenses: number;
}

/**
 * Revenue vs. expenses per calendar month, most recent `months` months
 * (default 6) up to and including the current month — the dashboard's
 * trend chart. One aggregation query grouped by month and account type,
 * not `months` separate `getProfitAndLoss` calls.
 */
export async function getMonthlyRevenueExpense(tenantId: string, months = 6): Promise<MonthlyFinancialRow[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const from = start.toISOString().slice(0, 10);

  const rows = await db
    .select({
      month: sql<string>`to_char(${journalEntries.entryDate}, 'YYYY-MM')`,
      type: ledgerAccounts.type,
      totalDebit: sql<string>`coalesce(sum(${journalEntryLines.debit}), 0)`,
      totalCredit: sql<string>`coalesce(sum(${journalEntryLines.credit}), 0)`,
    })
    .from(journalEntryLines)
    .innerJoin(journalEntries, eq(journalEntries.id, journalEntryLines.journalEntryId))
    .innerJoin(ledgerAccounts, eq(ledgerAccounts.id, journalEntryLines.accountId))
    .where(
      and(
        eq(ledgerAccounts.tenantId, tenantId),
        gte(journalEntries.entryDate, from),
        sql`${ledgerAccounts.type} in ('income', 'expense')`,
      ),
    )
    .groupBy(sql`to_char(${journalEntries.entryDate}, 'YYYY-MM')`, ledgerAccounts.type);

  const byMonth = new Map<string, MonthlyFinancialRow>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = d.toISOString().slice(0, 7);
    byMonth.set(key, { month: key, revenue: 0, expenses: 0 });
  }

  for (const r of rows) {
    const entry = byMonth.get(r.month);
    if (!entry) continue; // outside the requested window (shouldn't happen given the `from` filter, but keep it safe)
    const debit = Number(r.totalDebit);
    const credit = Number(r.totalCredit);
    if (r.type === "income") entry.revenue += credit - debit;
    else entry.expenses += debit - credit;
  }

  return Array.from(byMonth.values());
}
