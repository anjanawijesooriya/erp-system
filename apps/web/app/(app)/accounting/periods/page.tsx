import { listPeriods } from "@erp/core/accounting";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader, Card, EmptyState } from "@erp/ui/card";
import { Badge } from "@erp/ui/badge";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { ClipboardIcon } from "@/components/icons";
import { PeriodForm } from "./period-form";

export default async function PeriodsPage() {
  const { tenantId, userId } = await requireSession();
  const [periods, canClose] = await Promise.all([listPeriods(tenantId), can(userId, PERMISSIONS.PERIOD_CLOSE)]);

  return (
    <ModuleGate tenantId={tenantId} moduleKey="accounting">
    <main className="mx-auto max-w-3xl p-8">
      <PageHeader
        title="Accounting periods"
        description="Close periods to lock the books against new journal postings."
        icon={<ClipboardIcon className="h-5 w-5" />}
      />

      {canClose && (
        <div className="mb-6">
          <PeriodForm />
        </div>
      )}

      {periods.length === 0 ? (
        <Card>
          <EmptyState icon={<ClipboardIcon className="h-5 w-5" />} title="No periods closed yet." description="Everything is currently open." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Start</th>
                <th className="px-4 py-2.5">End</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Closed at</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 text-slate-900">{p.periodStart}</td>
                  <td className="px-4 py-2.5 text-slate-900">{p.periodEnd}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={p.isClosed ? "slate" : "accent"}>{p.isClosed ? "Closed" : "Open"}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{p.closedAt ? new Date(p.closedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </main>
    </ModuleGate>
  );
}
