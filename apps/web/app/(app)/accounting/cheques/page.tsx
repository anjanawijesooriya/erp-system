import { listCheques } from "@erp/core/accounting";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { getCustomerOptions, getSupplierOptions } from "@/lib/party-options";
import { ChequeForm } from "./cheque-form";
import { ChequeStatusActions } from "./cheque-actions";

export default async function ChequesPage() {
  const { tenantId, userId } = await requireSession();
  const [cheques, branches, customers, suppliers, canManage] = await Promise.all([
    listCheques(tenantId),
    getBranchOptions(tenantId),
    getCustomerOptions(tenantId),
    getSupplierOptions(tenantId),
    can(userId, PERMISSIONS.CHEQUE_MANAGE),
  ]);

  return (
    <ModuleGate tenantId={tenantId} moduleKey="accounting">
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Cheques (PDC tracking)</h1>

      {canManage && branches.length > 0 && (
        <div className="mb-6">
          <ChequeForm branches={branches} customers={customers} suppliers={suppliers} />
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Cheque #</th>
              <th className="px-4 py-2">Direction</th>
              <th className="px-4 py-2">Party</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cheques.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{c.chequeNumber}</td>
                <td className="px-4 py-2 capitalize">{c.direction}</td>
                <td className="px-4 py-2">{c.customer?.name ?? c.supplier?.name ?? "—"}</td>
                <td className="px-4 py-2">{c.chequeDate}</td>
                <td className="px-4 py-2 text-right">{c.amount}</td>
                <td className="px-4 py-2 capitalize">{c.status}</td>
                <td className="px-4 py-2">
                  {canManage && <ChequeStatusActions chequeId={c.id} status={c.status} />}
                </td>
              </tr>
            ))}
            {cheques.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No cheques recorded yet.
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
