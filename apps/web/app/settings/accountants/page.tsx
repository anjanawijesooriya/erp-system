import { listAccountantsForTenant } from "@erp/core/accountant-portal";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { AppNav } from "@/components/app-nav";
import { ModuleGate } from "@/components/module-gate";
import { InviteAccountantForm } from "./invite-form";
import { UnlinkAccountantButton } from "./unlink-button";

export default async function AccountantsSettingsPage() {
  const { tenantId, userId } = await requireSession();
  const [links, canManage] = await Promise.all([
    listAccountantsForTenant(tenantId),
    can(userId, PERMISSIONS.TENANT_SETTINGS_MANAGE),
  ]);

  return (
    <ModuleGate tenantId={tenantId} moduleKey="accountant_portal">
      <main className="mx-auto max-w-3xl p-8">
        <AppNav />
        <h1 className="mb-4 text-xl font-semibold">Linked accountants</h1>
        <p className="mb-4 text-sm text-slate-500">
          An accountant you invite here signs in separately at <code className="rounded bg-slate-100 px-1">/accountant/login</code>,
          and can switch between every company that's invited them from one dashboard.
        </p>

        {canManage && (
          <div className="mb-6">
            <InviteAccountantForm />
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Access</th>
                {canManage && <th className="px-4 py-2" />}
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.accountantId} className="border-t border-slate-100">
                  <td className="px-4 py-2">{l.accountant.name}</td>
                  <td className="px-4 py-2">{l.accountant.email}</td>
                  <td className="px-4 py-2">{l.canPostJournals ? "Can post journals" : "View only"}</td>
                  {canManage && (
                    <td className="px-4 py-2">
                      <UnlinkAccountantButton accountantId={l.accountantId} />
                    </td>
                  )}
                </tr>
              ))}
              {links.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 4 : 3} className="px-4 py-6 text-center text-slate-400">
                    No accountants linked yet.
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
