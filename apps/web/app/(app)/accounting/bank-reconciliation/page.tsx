import { listBankAccountTransactions, listReconciliations } from "@erp/core/accounting";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { ReconciliationForm } from "./reconciliation-form";

export default async function BankReconciliationPage() {
  const { tenantId, userId } = await requireSession();
  const [transactions, reconciliations, canManage] = await Promise.all([
    listBankAccountTransactions(tenantId),
    listReconciliations(tenantId),
    can(userId, PERMISSIONS.BANK_RECONCILIATION_MANAGE),
  ]);

  return (
    <ModuleGate tenantId={tenantId} moduleKey="accounting">
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Bank reconciliation</h1>

      {canManage && (
        <div className="mb-6">
          <ReconciliationForm transactions={transactions} />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-2.5">{r.statementDate}</td>
                <td className="px-4 py-2.5 text-right">{r.statementBalance}</td>
                <td className="px-4 py-2.5 text-right">{r.items.length}</td>
              </tr>
            ))}
            {reconciliations.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  No reconciliations completed yet.
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
