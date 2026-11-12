import Link from "next/link";
import { notFound } from "next/navigation";
import { assertAccountantHasTenantAccess, getTenantName } from "@erp/core/accountant-portal";
import { getTrialBalance, listJournalEntries } from "@erp/core/accounting";
import { requireAccountantSession } from "@/lib/accountant-session";
import { InternalShell, InternalTopbar } from "@/components/internal-topbar";
import { accountantLogoutAction } from "../actions";

/**
 * Read-only for now: `canPostJournals` is recorded on the link (see
 * accountant_tenant_links) for a future posting UI, but actually posting
 * requires `journal_entries.created_by_user_id` to resolve to a row in
 * this tenant's `users` table, which an accountant deliberately isn't
 * (see accountants vs. users in schema/accountant-portal.ts) — wiring
 * that up needs either a nullable posted-by-accountant column or a
 * synthetic per-tenant "accountant" user, left for a follow-up rather
 * than bolted on here.
 */
export default async function AccountantTenantPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const session = await requireAccountantSession();

  try {
    await assertAccountantHasTenantAccess(session.accountantId, tenantId);
  } catch {
    notFound();
  }

  const [tenant, trialBalance, journalEntries] = await Promise.all([
    getTenantName(tenantId),
    getTrialBalance(tenantId),
    listJournalEntries(tenantId),
  ]);
  if (!tenant) notFound();

  const totalDebit = trialBalance.reduce((s, r) => s + Number(r.totalDebit), 0);
  const totalCredit = trialBalance.reduce((s, r) => s + Number(r.totalCredit), 0);

  return (
    <InternalShell>
      <InternalTopbar
        label="Accountant portal"
        title="Nexora ERP"
        subtitle={`Signed in as ${session.email}`}
        logoutAction={accountantLogoutAction}
      />

      <main className="mx-auto max-w-4xl p-8">
        <Link href="/accountant" className="text-xs font-medium text-brand-700 hover:text-brand-800">
          ← Your companies
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{tenant.name}</h1>

        <h2 className="mb-2 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">Trial balance</h2>
        <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Account</th>
                <th className="px-4 py-2.5">Debit</th>
                <th className="px-4 py-2.5">Credit</th>
              </tr>
            </thead>
            <tbody>
              {trialBalance.map((r) => (
                <tr key={r.accountCode} className="border-t border-slate-100">
                  <td className="px-4 py-2.5">
                    {r.accountCode} — {r.accountName}
                  </td>
                  <td className="px-4 py-2.5">{Number(r.totalDebit).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{Number(r.totalCredit).toLocaleString()}</td>
                </tr>
              ))}
              <tr className="border-t border-slate-200 font-medium">
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5">{totalDebit.toLocaleString()}</td>
                <td className="px-4 py-2.5">{totalCredit.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Recent journal entries</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Doc #</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Memo</th>
              </tr>
            </thead>
            <tbody>
              {journalEntries.slice(0, 25).map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5">{e.docNumber}</td>
                  <td className="px-4 py-2.5">{e.entryDate}</td>
                  <td className="px-4 py-2.5">{e.memo}</td>
                </tr>
              ))}
              {journalEntries.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                    No journal entries yet.
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
