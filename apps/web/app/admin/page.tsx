import { listTenantsWithUsage } from "@erp/core/platform-admin";
import { requireAdmin } from "@/lib/require-admin";
import { PlanSelect } from "./plan-select";
import { ViewButton } from "./view-button";
import { adminLogoutAction } from "./actions";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const tenants = await listTenantsWithUsage();

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
    </main>
  );
}
