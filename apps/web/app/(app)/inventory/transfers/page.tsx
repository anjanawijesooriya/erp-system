import { listTransfers, listWarehouses } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getVariantOptions } from "@/lib/product-options";
import { TransferForm } from "./transfer-form";

export default async function TransfersPage() {
  const { tenantId, userId } = await requireSession();
  const [transfers, warehouses, variants, canTransfer] = await Promise.all([
    listTransfers(tenantId),
    listWarehouses(tenantId),
    getVariantOptions(tenantId),
    can(userId, PERMISSIONS.STOCK_TRANSFER),
  ]);

  return (
    <ModuleGate tenantId={tenantId} moduleKey="inventory">
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Stock transfers</h1>

      {canTransfer && warehouses.length >= 2 && variants.length > 0 && (
        <div className="mb-6">
          <TransferForm warehouses={warehouses} variants={variants} />
        </div>
      )}
      {canTransfer && (warehouses.length < 2 || variants.length === 0) && (
        <p className="mb-6 text-sm text-slate-500">
          Add at least two warehouses and one product before creating a transfer.
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">From</th>
              <th className="px-4 py-2.5">To</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Lines</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-4 py-2.5">{new Date(t.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2.5">{t.fromWarehouse?.name}</td>
                <td className="px-4 py-2.5">{t.toWarehouse?.name}</td>
                <td className="px-4 py-2.5 capitalize">{t.status}</td>
                <td className="px-4 py-2.5 text-right">{t.lines.length}</td>
              </tr>
            ))}
            {transfers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No transfers yet.
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
