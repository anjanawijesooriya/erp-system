import { listPayrollRuns } from "@erp/core/hr";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { AppNav } from "@/components/app-nav";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { RunPayrollForm } from "./run-payroll-form";
import { MarkPaidButton } from "./mark-paid-button";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default async function PayrollPage() {
  const { tenantId, userId } = await requireSession();
  const [runs, branches, canProcess] = await Promise.all([
    listPayrollRuns(tenantId),
    getBranchOptions(tenantId),
    can(userId, PERMISSIONS.PAYROLL_PROCESS),
  ]);

  return (
    <ModuleGate tenantId={tenantId} moduleKey="payroll">
      <main className="mx-auto max-w-5xl p-8">
        <AppNav />
        <h1 className="mb-4 text-xl font-semibold">Payroll</h1>

        {canProcess && (
          <div className="mb-6">
            <RunPayrollForm branches={branches} />
          </div>
        )}

        <div className="space-y-4">
          {runs.map((run) => {
            const totalGross = run.lines.reduce((s, l) => s + Number(l.grossSalary), 0);
            const totalNet = run.lines.reduce((s, l) => s + Number(l.netSalary), 0);
            return (
              <div key={run.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2">
                  <div className="text-sm font-medium">
                    {MONTH_NAMES[run.periodMonth - 1]} {run.periodYear} — {run.branch?.name}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs capitalize text-slate-500">{run.status}</span>
                    {canProcess && run.status === "posted" && <MarkPaidButton payrollRunId={run.id} />}
                  </div>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Employee</th>
                      <th className="px-4 py-2">Gross</th>
                      <th className="px-4 py-2">EPF (emp)</th>
                      <th className="px-4 py-2">APIT</th>
                      <th className="px-4 py-2">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {run.lines.map((l) => (
                      <tr key={l.id} className="border-t border-slate-100">
                        <td className="px-4 py-2">{l.employee?.name}</td>
                        <td className="px-4 py-2">{Number(l.grossSalary).toLocaleString()}</td>
                        <td className="px-4 py-2">{Number(l.epfEmployeeAmount).toLocaleString()}</td>
                        <td className="px-4 py-2">{Number(l.apitAmount).toLocaleString()}</td>
                        <td className="px-4 py-2 font-medium">{Number(l.netSalary).toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-200 font-medium">
                      <td className="px-4 py-2">Total</td>
                      <td className="px-4 py-2">{totalGross.toLocaleString()}</td>
                      <td className="px-4 py-2" />
                      <td className="px-4 py-2" />
                      <td className="px-4 py-2">{totalNet.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
          {runs.length === 0 && <p className="text-sm text-slate-400">No payroll runs yet.</p>}
        </div>
      </main>
    </ModuleGate>
  );
}
