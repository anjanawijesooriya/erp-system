import { listAccounts, listJournalEntries } from "@erp/core/accounting";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { ReceiptIcon } from "@/components/icons";
import { JournalForm } from "./journal-form";
import { JournalClient } from "./journal-client";

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
      <PageHeader
        title="Journal entries"
        description="Manual double-entry postings — every entry must balance before it can be posted."
        icon={<ReceiptIcon className="h-5 w-5" />}
      />

      {canPost && branches.length > 0 && accounts.length > 0 && (
        <div className="mb-6">
          <JournalForm branches={branches} accounts={accountOptions} />
        </div>
      )}

      <JournalClient entries={entries} canPost={canPost} />
    </main>
    </ModuleGate>
  );
}
