import Link from "next/link";
import { notFound } from "next/navigation";
import { assertAccountantHasTenantAccess, getTenantName } from "@erp/core/accountant-portal";
import { getTrialBalance, listJournalEntries } from "@erp/core/accounting";
import { requireAccountantSession } from "@/lib/accountant-session";

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
    <main className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/accountant" className="text-xs text-slate-400 hover:underline">
            ← Your companies
          </Link>
          <h1 className="text-xl font-semibold">{tenant.name}</h1>
        </div>
      </div>

      <h2 className="mb-2 text-lg font-semibold">Trial balance</h2>
      <div className="mb-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Account</th>
              <th className="px-4 py-2">Debit</th>
              <th className="px-4 py-2">Credit</th>
            </tr>
          </thead>
          <tbody>
            {trialBalance.map((r) => (
              <tr key={r.accountCode} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  {r.accountCode} — {r.accountName}
                </td>
                <td className="px-4 py-2">{Number(r.totalDebit).toLocaleString()}</td>
                <td className="px-4 py-2">{Number(r.totalCredit).toLocaleString()}</td>
              </tr>
            ))}
            <tr className="border-t border-slate-200 font-medium">
              <td className="px-4 py-2">Total</td>
              <td className="px-4 py-2">{totalDebit.toLocaleString()}</td>
              <td className="px-4 py-2">{totalCredit.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 text-lg font-semibold">Recent journal entries</h2>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Doc #</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Memo</th>
            </tr>
          </thead>
          <tbody>
            {journalEntries.slice(0, 25).map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{e.docNumber}</td>
                <td className="px-4 py-2">{e.entryDate}</td>
                <td className="px-4 py-2">{e.memo}</td>
              </tr>
            ))}
            {journalEntries.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  No journal entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
