import { getBalanceSheet, getProfitAndLoss, getTrialBalance } from "@erp/core/accounting";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";

function today() {
  return new Date().toISOString().slice(0, 10);
}
function startOfYear() {
  return `${new Date().getFullYear()}-01-01`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; asOf?: string }>;
}) {
  const { tenantId } = await requireSession();
  const { from = startOfYear(), to = today(), asOf = today() } = await searchParams;

  const [trialBalance, pl, bs] = await Promise.all([
    getTrialBalance(tenantId, { from, to }),
    getProfitAndLoss(tenantId, { from, to }),
    getBalanceSheet(tenantId, asOf),
  ]);

  return (
    <ModuleGate tenantId={tenantId} moduleKey="accounting">
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Financial reports</h1>

      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white shadow-sm p-4 text-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">P&L / Trial balance from</label>
          <input name="from" type="date" defaultValue={from} className="rounded-md border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">to</label>
          <input name="to" type="date" defaultValue={to} className="rounded-md border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Balance sheet as of</label>
          <input name="asOf" type="date" defaultValue={asOf} className="rounded-md border border-slate-300 px-3 py-2" />
        </div>
        <button type="submit" className="rounded-md border border-slate-300 px-3 py-2">
          Update
        </button>
      </form>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Trial balance ({from} – {to})</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Account</th>
                <th className="px-4 py-2.5 text-right">Debit</th>
                <th className="px-4 py-2.5 text-right">Credit</th>
                <th className="px-4 py-2.5 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {trialBalance.map((r) => (
                <tr key={r.accountCode} className="border-t border-slate-100">
                  <td className="px-4 py-2.5">{r.accountCode}</td>
                  <td className="px-4 py-2.5">{r.accountName}</td>
                  <td className="px-4 py-2.5 text-right">{r.totalDebit}</td>
                  <td className="px-4 py-2.5 text-right">{r.totalCredit}</td>
                  <td className="px-4 py-2 text-right font-medium">{r.balance}</td>
                </tr>
              ))}
              {trialBalance.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No activity in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Profit &amp; loss ({from} – {to})</h2>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 text-sm">
          <div className="mb-2 font-medium">Income</div>
          {pl.income.map((r) => (
            <div key={r.accountCode} className="flex justify-between py-0.5">
              <span>{r.accountName}</span>
              <span>{r.amount}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-1 font-medium">
            <span>Total income</span>
            <span>{pl.totalIncome}</span>
          </div>
          <div className="mb-2 mt-4 font-medium">Expenses</div>
          {pl.expenses.map((r) => (
            <div key={r.accountCode} className="flex justify-between py-0.5">
              <span>{r.accountName}</span>
              <span>{r.amount}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-1 font-medium">
            <span>Total expenses</span>
            <span>{pl.totalExpenses}</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-slate-300 pt-2 text-base font-semibold">
            <span>Net profit</span>
            <span>{pl.netProfit}</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Balance sheet (as of {asOf})</h2>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 text-sm">
          <div className="mb-2 font-medium">Assets</div>
          {bs.assets.map((r) => (
            <div key={r.accountCode} className="flex justify-between py-0.5">
              <span>{r.accountName}</span>
              <span>{r.amount}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-1 font-medium">
            <span>Total assets</span>
            <span>{bs.totalAssets}</span>
          </div>

          <div className="mb-2 mt-4 font-medium">Liabilities</div>
          {bs.liabilities.map((r) => (
            <div key={r.accountCode} className="flex justify-between py-0.5">
              <span>{r.accountName}</span>
              <span>{r.amount}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-1 font-medium">
            <span>Total liabilities</span>
            <span>{bs.totalLiabilities}</span>
          </div>

          <div className="mb-2 mt-4 font-medium">Equity</div>
          {bs.equity.map((r) => (
            <div key={r.accountCode} className="flex justify-between py-0.5">
              <span>{r.accountName}</span>
              <span>{r.amount}</span>
            </div>
          ))}
          <div className="flex justify-between py-0.5">
            <span>Net income (unclosed)</span>
            <span>{bs.unclosedNetIncome}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-1 font-medium">
            <span>Total equity</span>
            <span>{(Number(bs.totalEquity) + Number(bs.unclosedNetIncome)).toFixed(2)}</span>
          </div>
        </div>
      </section>
    </main>
    </ModuleGate>
  );
}
