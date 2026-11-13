import { listPayrollRuns } from "@erp/core/hr";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { WalletIcon } from "@/components/icons";
import { PayrollClient } from "./payroll-client";

export default async function PayrollPage() {
  const { tenantId, userId } = await requireSession();
  const [runs, branches, canProcess] = await Promise.all([
    listPayrollRuns(tenantId),
    getBranchOptions(tenantId),
    can(userId, PERMISSIONS.PAYROLL_PROCESS),
  ]);

  const rows = runs.map((r) => ({
    id: r.id,
    periodYear: r.periodYear,
    periodMonth: r.periodMonth,
    branchName: r.branch?.name ?? "—",
    status: r.status,
    employeeCount: r.lines.length,
    grossTotal: r.lines.reduce((sum, l) => sum + Number(l.grossSalary), 0),
    netTotal: r.lines.reduce((sum, l) => sum + Number(l.netSalary), 0),
  }));

  return (
    <ModuleGate tenantId={tenantId} moduleKey="payroll">
      <main className="mx-auto max-w-5xl p-8">
        <PageHeader
          title="Payroll"
          description="Run and track monthly payroll for all branches."
          icon={<WalletIcon className="h-5 w-5" />}
        />

        <PayrollClient runs={rows} branches={branches} canProcess={canProcess} />
      </main>
    </ModuleGate>
  );
}
