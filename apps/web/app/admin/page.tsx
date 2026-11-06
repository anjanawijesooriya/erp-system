import { listTenantsWithUsage } from "@erp/core/platform-admin";
import { listAllIssues } from "@erp/core/pilot";
import { requireAdmin } from "@/lib/require-admin";
import { InternalShell, InternalTopbar } from "@/components/internal-topbar";
import { PlanSelect } from "./plan-select";
import { ViewButton } from "./view-button";
import { AdminIssueStatusSelect } from "./issue-status-select";
import { adminLogoutAction } from "./actions";

const SEVERITY_BADGE: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const PLAN_BADGE: Record<string, string> = {
  pos: "bg-slate-100 text-slate-600",
  business: "bg-sky-100 text-sky-700",
  erp: "bg-violet-100 text-violet-700",
};

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [tenants, issues] = await Promise.all([listTenantsWithUsage(), listAllIssues()]);

  return (
    <InternalShell>
      <InternalTopbar label="Platform admin" title="Nexora ERP" subtitle={`Signed in as ${admin.email}`} logoutAction={adminLogoutAction} />

      <main className="mx-auto max-w-6xl p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tenants</h1>
        <p className="mt-1 text-sm text-slate-500">Every shop running on Nexora ERP, and their plan/usage.</p>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Tenant</th>
                <th className="px-4 py-2.5">Slug</th>
                <th className="px-4 py-2.5">Plan</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Branches</th>
                <th className="px-4 py-2.5 text-right">Users</th>
                <th className="px-4 py-2.5 text-right">Products</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-medium text-slate-900">{t.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{t.slug}</td>
                  <td className="px-4 py-2.5">
                    <PlanSelect tenantId={t.id} currentPlan={t.plan} />
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PLAN_BADGE[t.plan ?? "pos"] ?? "bg-slate-100 text-slate-600"}`}>
                      {t.subscriptionStatus ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">{t.branchCount}</td>
                  <td className="px-4 py-2.5 text-right">{t.userCount}</td>
                  <td className="px-4 py-2.5 text-right">{t.productCount}</td>
                  <td className="px-4 py-2.5">
                    <ViewButton tenantId={t.id} />
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No tenants yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          &quot;View&quot; records an audit-logged access event rather than swapping into a real tenant
          session — true session impersonation is a follow-up for a dedicated secure flow.
        </p>

        <h2 className="mb-2 mt-10 text-lg font-semibold text-slate-900">Pilot issues (all tenants)</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Tenant</th>
                <th className="px-4 py-2.5">Title</th>
                <th className="px-4 py-2.5">Severity</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((i) => (
                <tr key={i.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-2.5">{i.tenant?.name}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-900">{i.title}</div>
                    {i.description && <div className="text-xs text-slate-500">{i.description}</div>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${SEVERITY_BADGE[i.severity]}`}>
                      {i.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{new Date(i.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5">
                    <AdminIssueStatusSelect issueId={i.id} status={i.status} />
                  </td>
                </tr>
              ))}
              {issues.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No issues reported yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </InternalShell>
  );
}
