import { listAccounts, listJournalEntries } from "@erp/core/accounting";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { JournalForm } from "./journal-form";
import { EntryActions } from "./entry-row";

export default async function JournalPage() {
  const { tenantId, userId } = await requireSession();
  const [entries, branches, accounts, canPost] = await Promise.all([
    listJournalEntries(tenantId),
    getBranchOptions(tenantId),
    listAccounts(tenantId),
    can(userId, PERMISSIONS.JOURNAL_POST),
  ]);

  const accountOptions = accounts.map((a) => ({ code: a.code, name: a.name }));

  return (
    <ModuleGate tenantId={tenantId} moduleKey="accounting">
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Journal entries</h1>

      {canPost && branches.length > 0 && accounts.length > 0 && (
        <div className="mb-6">
          <JournalForm branches={branches} accounts={accountOptions} />
        </div>
      )}

      <div className="space-y-3">
        {entries.map((e) => (
          <div key={e.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <div className="mb-2 flex items-center justify-between">
              <span>
                {e.docNumber} · {e.entryDate} · <span className="capitalize">{e.referenceType.replace(/_/g, " ")}</span>
                {e.memo ? ` — ${e.memo}` : ""}
                {e.reversalOfEntryId && <span className="ml-2 text-xs text-amber-600">(reversal)</span>}
              </span>
              <EntryActions entryId={e.id} branchId={e.branchId} canPost={canPost} isReversal={!!e.reversalOfEntryId} />
            </div>
            <table className="w-full text-left">
              <tbody>
                {e.lines.map((line) => (
                  <tr key={line.id} className="border-t border-slate-100">
                    <td className="py-1">
                      {line.account.code} — {line.account.name}
                    </td>
                    <td className="py-1 text-right">{Number(line.debit) > 0 ? Number(line.debit).toFixed(2) : ""}</td>
                    <td className="py-1 text-right">{Number(line.credit) > 0 ? Number(line.credit).toFixed(2) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {entries.length === 0 && <p className="text-sm text-slate-400">No journal entries yet.</p>}
      </div>
    </main>
    </ModuleGate>
  );
}
