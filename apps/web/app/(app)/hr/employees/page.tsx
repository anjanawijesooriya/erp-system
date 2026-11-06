import { listEmployees } from "@erp/core/hr";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { EmployeeForm } from "./employee-form";
import { TerminateButton } from "./terminate-button";

export default async function EmployeesPage() {
  const { tenantId, userId } = await requireSession();
  const [employees, branches, canManage] = await Promise.all([
    listEmployees(tenantId),
    getBranchOptions(tenantId),
    can(userId, PERMISSIONS.EMPLOYEE_MANAGE),
  ]);

  return (
    <ModuleGate tenantId={tenantId} moduleKey="payroll">
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Employees</h1>

        {canManage && (
          <div className="mb-6">
            <EmployeeForm branches={branches} />
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Branch</th>
                <th className="px-4 py-2.5">Basic salary</th>
                <th className="px-4 py-2.5">Allowances</th>
                <th className="px-4 py-2.5">Status</th>
                {canManage && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5">{e.employeeNumber}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-slate-500">{e.designation}</div>
                  </td>
                  <td className="px-4 py-2.5">{e.branch?.name}</td>
                  <td className="px-4 py-2.5">{Number(e.basicSalary).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{Number(e.fixedAllowances).toLocaleString()}</td>
                  <td className="px-4 py-2.5 capitalize">{e.status}</td>
                  {canManage && (
                    <td className="px-4 py-2.5">{e.status === "active" && <TerminateButton employeeId={e.id} />}</td>
                  )}
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-4 py-8 text-center text-slate-400">
                    No employees yet.
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
