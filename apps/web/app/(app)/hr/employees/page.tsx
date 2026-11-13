import { listEmployees } from "@erp/core/hr";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { UsersIcon } from "@/components/icons";
import { EmployeesClient } from "./employees-client";

export default async function EmployeesPage() {
  const { tenantId, userId } = await requireSession();
  const [employees, branches, canManage] = await Promise.all([
    listEmployees(tenantId),
    getBranchOptions(tenantId),
    can(userId, PERMISSIONS.EMPLOYEE_MANAGE),
  ]);

  const branchCount = new Set(employees.map((e) => e.branchId)).size;

  const rows = employees.map((e) => ({
    id: e.id,
    employeeNumber: e.employeeNumber,
    name: e.name,
    designation: e.designation,
    branchName: e.branch?.name ?? "—",
    basicSalary: e.basicSalary,
    fixedAllowances: e.fixedAllowances,
    status: e.status,
    dateOfJoining: e.dateOfJoining,
  }));

  return (
    <ModuleGate tenantId={tenantId} moduleKey="payroll">
      <main className="mx-auto max-w-5xl p-8">
        <PageHeader
          title="Employees"
          description={`${rows.length} employee${rows.length === 1 ? "" : "s"}${branchCount > 0 ? ` across ${branchCount} branch${branchCount === 1 ? "" : "es"}` : ""}`}
          icon={<UsersIcon className="h-5 w-5" />}
        />

        <EmployeesClient employees={rows} branches={branches} canManage={canManage} />
      </main>
    </ModuleGate>
  );
}
