import { notFound } from "next/navigation";
import Link from "next/link";
import { getPayrollRun } from "@erp/core/hr";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader, Card, StatTile } from "@erp/ui/card";
import { Badge } from "@erp/ui/badge";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { WalletIcon } from "@/components/icons";
import { MarkPaidButton } from "../mark-paid-button";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_TONES = ["bg-brand-700", "bg-success-600", "bg-warning-600", "bg-info-600", "bg-slate-500", "bg-danger-600"];
function avatarToneFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

export default async function PayrollRunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId, userId } = await requireSession();

  const [run, canProcess] = await Promise.all([getPayrollRun(tenantId, id), can(userId, PERMISSIONS.PAYROLL_PROCESS)]);
  if (!run) notFound();

  const grossTotal = run.lines.reduce((sum, l) => sum + Number(l.grossSalary), 0);
  const epfEmployeeTotal = run.lines.reduce((sum, l) => sum + Number(l.epfEmployeeAmount), 0);
  const epfEtfEmployerTotal = run.lines.reduce((sum, l) => sum + Number(l.epfEmployerAmount) + Number(l.etfAmount), 0);
  const netTotal = run.lines.reduce((sum, l) => sum + Number(l.netSalary), 0);

  return (
    <ModuleGate tenantId={tenantId} moduleKey="payroll">
    <main className="mx-auto max-w-5xl p-8">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/hr/payroll" className="font-medium text-brand-700 hover:text-brand-800">
          Payroll
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-900">
          {MONTH_NAMES[run.periodMonth - 1]} {run.periodYear}
        </span>
      </div>

      <div className="mb-6 flex items-start justify-between gap-3">
        <PageHeader
          title={`${MONTH_NAMES[run.periodMonth - 1]} ${run.periodYear} payroll run`}
          description={`${run.branch?.name ?? "—"} · ${run.lines.length} employee${run.lines.length === 1 ? "" : "s"}`}
          icon={<WalletIcon className="h-5 w-5" />}
        />
        <Badge tone={run.status === "paid" ? "accent" : "amber"}>{run.status === "paid" ? "Paid" : "Pending payment"}</Badge>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <StatTile label="Gross pay" value={grossTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
        <StatTile label="EPF (employee 8%)" value={epfEmployeeTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} tone="rose" />
        <StatTile label="EPF/ETF (employer)" value={epfEtfEmployerTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
        <StatTile label="Net pay" value={netTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} tone="accent" />
      </div>

      {canProcess && run.status === "posted" && (
        <div className="mb-6 flex justify-end">
          <MarkPaidButton payrollRunId={run.id} />
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Payslips</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Employee</th>
              <th className="px-4 py-2.5 text-right">Basic</th>
              <th className="px-4 py-2.5 text-right">Allowances</th>
              <th className="px-4 py-2.5 text-right">Deductions</th>
              <th className="px-4 py-2.5 text-right">Net pay</th>
            </tr>
          </thead>
          <tbody>
            {run.lines.map((l) => {
              const deductions = Number(l.epfEmployeeAmount) + Number(l.apitAmount);
              return (
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarToneFor(l.id)}`}>
                        {initialsOf(l.employee?.name ?? "?")}
                      </span>
                      <span className="font-medium text-slate-900">{l.employee?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{Number(l.basicSalary).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{Number(l.fixedAllowances).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2.5 text-right text-danger-600">{deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-900">{Number(l.netSalary).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </main>
    </ModuleGate>
  );
}
