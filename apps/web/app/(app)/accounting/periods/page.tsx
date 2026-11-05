import { listPeriods } from "@erp/core/accounting";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { PeriodForm } from "./period-form";

export default async function PeriodsPage() {
  const { tenantId, userId } = await requireSession();
  const [periods, canClose] = await Promise.all([listPeriods(tenantId), can(userId, PERMISSIONS.PERIOD_CLOSE)]);

  return (
    <ModuleGate tenantId={tenantId} moduleKey="accounting">
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Accounting periods</h1>

      {canClose && (
        <div className="mb-6">
          <PeriodForm />
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Start</th>
              <th className="px-4 py-2">End</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Closed at</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{p.periodStart}</td>
                <td className="px-4 py-2">{p.periodEnd}</td>
                <td className="px-4 py-2">{p.isClosed ? "Closed" : "Open"}</td>
                <td className="px-4 py-2">{p.closedAt ? new Date(p.closedAt).toLocaleString() : "—"}</td>
              </tr>
            ))}
            {periods.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No periods closed yet — everything is open.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
    </ModuleGate>
  );
}
