import { listTenantsWithUsage } from "@erp/core/platform-admin";
import { listAllIssues } from "@erp/core/pilot";
import { requireAdmin } from "@/lib/require-admin";
import { PlanSelect } from "./plan-select";
import { ViewButton } from "./view-button";
import { AdminIssueStatusSelect } from "./issue-status-select";
import { adminLogoutAction } from "./actions";

const SEVERITY_COLORS: Record<string, string> = {
  low: "text-slate-500",
  medium: "text-amber-600",
  high: "text-orange-600",
  critical: "text-red-600 font-semibold",
};

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [tenants, issues] = await Promise.all([listTenantsWithUsage(), listAllIssues()]);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Platform admin</h1>
          <p className="text-sm text-slate-500">Signed in as {admin.email}</p>
        </div>
        <form action={adminLogoutAction}>
          <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" type="submit">
            Sign out
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Tenant</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Plan</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Branches</th>
              <th className="px-4 py-2 text-right">Users</th>
              <th className="px-4 py-2 text-right">Products</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{t.name}</td>
                <td className="px-4 py-2">{t.slug}</td>
                <td className="px-4 py-2">
                  <PlanSelect tenantId={t.id} currentPlan={t.plan} />
                </td>
                <td className="px-4 py-2">{t.subscriptionStatus ?? "—"}</td>
                <td className="px-4 py-2 text-right">{t.branchCount}</td>
                <td className="px-4 py-2 text-right">{t.userCount}</td>
                <td className="px-4 py-2 text-right">{t.productCount}</td>
                <td className="px-4 py-2">
                  <ViewButton tenantId={t.id} />
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                  No tenants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        &quot;Log view&quot; records an audit-logged access event rather than swapping into a real
        tenant session — true session impersonation is a follow-up for a dedicated secure flow.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold">Pilot issues (all tenants)</h2>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Tenant</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Severity</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((i) => (
              <tr key={i.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-2">{i.tenant?.name}</td>
                <td className="px-4 py-2">
                  <div className="font-medium">{i.title}</div>
                  {i.description && <div className="text-xs text-slate-500">{i.description}</div>}
                </td>
                <td className={`px-4 py-2 capitalize ${SEVERITY_COLORS[i.severity]}`}>{i.severity}</td>
                <td className="px-4 py-2">{new Date(i.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  <AdminIssueStatusSelect issueId={i.id} status={i.status} />
                </td>
              </tr>
            ))}
            {issues.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No issues reported yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
