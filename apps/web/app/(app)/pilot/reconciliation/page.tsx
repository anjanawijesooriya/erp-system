import { getReconciliationComparison } from "@erp/core/pilot";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { getBranchOptions } from "@/lib/branch-options";
import { ReconciliationEntryForm } from "./reconciliation-form";

const METRIC_LABELS: Record<string, string> = {
  sales: "Sales",
  cash: "Cash in hand",
  stock_value: "Stock value",
};

export default async function ReconciliationPage() {
  const { tenantId, userId } = await requireSession();
  const [rows, branches, canManage] = await Promise.all([
    getReconciliationComparison(tenantId),
    getBranchOptions(tenantId),
    can(userId, PERMISSIONS.RECONCILIATION_MANAGE),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-1 text-xl font-semibold">Weekly reconciliation</h1>
      <p className="mb-6 text-sm text-slate-500">
        Enter the shop&apos;s manually-kept figure for a day; the system figure is computed live
        from the ledger so it&apos;s always current. Large variances are usually a missed or
        duplicated entry — check the day&apos;s documents first.
      </p>

      {canManage && (
        <div className="mb-6">
          <ReconciliationEntryForm branches={branches} />
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Metric</th>
              <th className="px-4 py-2 text-right">System</th>
              <th className="px-4 py-2 text-right">Manual</th>
              <th className="px-4 py-2 text-right">Variance</th>
              <th className="px-4 py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-4 py-2">{r.entryDate}</td>
                <td className="px-4 py-2">{METRIC_LABELS[r.metric]}</td>
                <td className="px-4 py-2 text-right">{r.systemValue}</td>
                <td className="px-4 py-2 text-right">{r.manualValue}</td>
                <td
                  className={`px-4 py-2 text-right font-medium ${
                    Math.abs(Number(r.variance)) > 0.01 ? "text-amber-600" : "text-green-700"
                  }`}
                >
                  {r.variance}
                </td>
                <td className="px-4 py-2">{r.note ?? "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No reconciliation entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
