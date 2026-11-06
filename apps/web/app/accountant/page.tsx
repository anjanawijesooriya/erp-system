import Link from "next/link";
import { listTenantsForAccountant } from "@erp/core/accountant-portal";
import { requireAccountantSession } from "@/lib/accountant-session";
import { InternalShell, InternalTopbar } from "@/components/internal-topbar";
import { accountantLogoutAction } from "./actions";

export default async function AccountantDashboardPage() {
  const session = await requireAccountantSession();
  const links = await listTenantsForAccountant(session.accountantId);

  return (
    <InternalShell>
      <InternalTopbar
        label="Accountant portal"
        title="Nexora ERP"
        subtitle={`Signed in as ${session.email}`}
        logoutAction={accountantLogoutAction}
      />

      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Your companies</h1>
        <p className="mt-1 text-sm text-slate-500">Pick a company to view its books.</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {links.map(({ tenant, canPostJournals }) => (
            <Link
              key={tenant.id}
              href={`/accountant/${tenant.id}`}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="font-medium text-slate-900">{tenant.name}</p>
              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  canPostJournals ? "bg-accent-50 text-accent-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {canPostJournals ? "Can post journals" : "View only"}
              </span>
            </Link>
          ))}
          {links.length === 0 && (
            <p className="text-sm text-slate-400 sm:col-span-2">No companies have granted you access yet.</p>
          )}
        </div>
      </main>
    </InternalShell>
  );
}
