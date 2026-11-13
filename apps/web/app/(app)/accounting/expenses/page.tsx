import { listExpenseAccounts, listExpenses } from "@erp/core/accounting";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader, Card, EmptyState, StatTile } from "@erp/ui/card";
import { Badge } from "@erp/ui/badge";
import { requireSession } from "@/lib/session";
import { getBranchOptions } from "@/lib/branch-options";
import { ReceiptIcon } from "@/components/icons";
import { ExpenseForm } from "./expense-form";

export default async function ExpensesPage() {
  const { tenantId, userId } = await requireSession();
  const [expenses, branches, accounts, canRecord] = await Promise.all([
    listExpenses(tenantId),
    getBranchOptions(tenantId),
    listExpenseAccounts(tenantId),
    can(userId, PERMISSIONS.EXPENSE_RECORD),
  ]);

  const rows = expenses.map((e) => ({
    id: e.id,
    entryDate: e.entryDate,
    memo: e.memo,
    branchName: e.branch?.name ?? "—",
    category: e.lines.find((l) => Number(l.debit) > 0)?.account.name ?? "—",
    paidFrom: e.lines.find((l) => Number(l.credit) > 0)?.account.name ?? "—",
    amount: Number(e.lines.find((l) => Number(l.debit) > 0)?.debit ?? 0),
  }));

  const now = new Date();
  const monthRows = rows.filter((r) => {
    const d = new Date(r.entryDate);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const monthTotal = monthRows.reduce((sum, r) => sum + r.amount, 0);

  const categoryTotals = new Map<string, number>();
  for (const r of monthRows) categoryTotals.set(r.category, (categoryTotals.get(r.category) ?? 0) + r.amount);
  const topCategories = Array.from(categoryTotals, ([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 2);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader
        title="Expenses"
        description="Day-to-day business spending, categorized for your P&L."
        icon={<ReceiptIcon className="h-5 w-5" />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <StatTile label="This month" value={monthTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
        {topCategories.map((c) => (
          <StatTile key={c.name} label={c.name} value={c.total.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
        ))}
        {topCategories.length === 0 && <StatTile label="This month's top category" value="—" />}
      </div>

      {canRecord && (
        <div className="mb-6">
          <ExpenseForm branches={branches} accounts={accounts.map((a) => ({ code: a.code, name: a.name }))} />
        </div>
      )}

      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={<ReceiptIcon className="h-5 w-5" />} title="No expenses recorded yet." description="Record one above — it posts straight to your P&L." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5">Branch</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-2.5">
                    <Badge tone="slate">{r.category}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{r.memo}</td>
                  <td className="px-4 py-2.5 text-slate-600">{r.branchName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{r.entryDate}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-900">{r.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </main>
  );
}
