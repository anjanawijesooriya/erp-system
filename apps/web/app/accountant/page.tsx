import Link from "next/link";
import { listTenantsForAccountant } from "@erp/core/accountant-portal";
import { requireAccountantSession } from "@/lib/accountant-session";
import { accountantLogoutAction } from "./actions";

export default async function AccountantDashboardPage() {
  const session = await requireAccountantSession();
  const links = await listTenantsForAccountant(session.accountantId);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your companies</h1>
        <form action={accountantLogoutAction}>
          <button type="submit" className="text-sm text-slate-500 hover:underline">
            Sign out
          </button>
        </form>
      </div>

      <div className="space-y-2">
        {links.map(({ tenant, canPostJournals }) => (
          <Link
            key={tenant.id}
            href={`/accountant/${tenant.id}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
          >
            <span className="font-medium">{tenant.name}</span>
            <span className="text-xs text-slate-400">{canPostJournals ? "Can post journals" : "View only"}</span>
          </Link>
        ))}
        {links.length === 0 && (
          <p className="text-sm text-slate-400">No companies have granted you access yet.</p>
        )}
      </div>
    </main>
  );
}
