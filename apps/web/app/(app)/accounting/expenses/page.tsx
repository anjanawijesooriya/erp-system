import { listExpenseAccounts, listExpenses } from "@erp/core/accounting";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { getBranchOptions } from "@/lib/branch-options";
import { ExpenseForm } from "./expense-form";

export default async function ExpensesPage() {
  const { tenantId, userId } = await requireSession();
  const [expenses, branches, accounts, canRecord] = await Promise.all([
    listExpenses(tenantId),
    getBranchOptions(tenantId),
    listExpenseAccounts(tenantId),
    can(userId, PERMISSIONS.EXPENSE_RECORD),
  ]);

  const total = expenses.reduce((sum, e) => sum + Number(e.lines.find((l) => Number(l.debit) > 0)?.debit ?? 0), 0);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Expenses</h1>
      <p className="mt-1 text-sm text-slate-500">
        Day-to-day spending — rent, utilities, supplies. Posts straight through to your P&amp;L; for
        full double-entry control, use Journal instead.
      </p>

      {canRecord && (
        <div className="mt-6">
          <ExpenseForm branches={branches} accounts={accounts.map((a) => ({ code: a.code, name: a.name }))} />
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent expenses</h2>
        <p className="text-sm text-slate-500">
          Total: <span className="font-semibold text-slate-900">{total.toLocaleString()}</span>
        </p>
      </div>
      <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Description</th>
              <th className="px-4 py-2.5">Branch</th>
              <th className="px-4 py-2.5">Paid from</th>
              <th className="px-4 py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => {
              const expenseLine = e.lines.find((l) => Number(l.debit) > 0);
              const paidFromLine = e.lines.find((l) => Number(l.credit) > 0);
              return (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5">{e.entryDate}</td>
                  <td className="px-4 py-2.5">{expenseLine?.account.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{e.memo}</td>
                  <td className="px-4 py-2.5">{e.branch?.name}</td>
                  <td className="px-4 py-2.5">{paidFromLine?.account.name}</td>
                  <td className="px-4 py-2.5 text-right font-medium">
                    {Number(expenseLine?.debit ?? 0).toLocaleString()}
                  </td>
                </tr>
              );
            })}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No expenses recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
