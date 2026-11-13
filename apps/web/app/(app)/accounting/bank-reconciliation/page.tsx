import { listBankAccountTransactions, listReconciliations } from "@erp/core/accounting";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader, Card, EmptyState, StatTile } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { BuildingIcon } from "@/components/icons";
import { ReconciliationForm } from "./reconciliation-form";

export default async function BankReconciliationPage() {
  const { tenantId, userId } = await requireSession();
  const [transactions, reconciliations, canManage] = await Promise.all([
    listBankAccountTransactions(tenantId),
    listReconciliations(tenantId),
    can(userId, PERMISSIONS.BANK_RECONCILIATION_MANAGE),
  ]);

  const ledgerBalance = transactions.reduce((sum, t) => sum + (Number(t.debit) - Number(t.credit)), 0);
  const unmatched = transactions.filter((t) => !t.isReconciled).length;

  return (
    <ModuleGate tenantId={tenantId} moduleKey="accounting">
    <main className="mx-auto max-w-4xl p-8">
      <PageHeader
        title="Bank reconciliation"
        description="Match your bank statement against the ledger to confirm they agree."
        icon={<BuildingIcon className="h-5 w-5" />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        <StatTile label="Ledger balance (1010)" value={ledgerBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
        <StatTile label="Unmatched items" value={unmatched} tone="amber" />
        <StatTile label="Completed reconciliations" value={reconciliations.length} />
      </div>

      {canManage && (
        <div className="mb-6">
          <ReconciliationForm transactions={transactions} />
        </div>
      )}

      {reconciliations.length === 0 ? (
        <Card>
          <EmptyState icon={<BuildingIcon className="h-5 w-5" />} title="No reconciliations completed yet." description="Complete one above once your statement arrives." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Statement date</th>
                <th className="px-4 py-2.5 text-right">Statement balance</th>
                <th className="px-4 py-2.5 text-right">Items</th>
              </tr>
            </thead>
            <tbody>
              {reconciliations.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 text-slate-900">{r.statementDate}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-900">{Number(r.statementBalance).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{r.items.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </main>
    </ModuleGate>
  );
}
