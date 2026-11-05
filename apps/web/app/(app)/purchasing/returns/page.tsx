import { listPurchaseReturns } from "@erp/core/purchasing";
import { listWarehouses } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { getSupplierOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { PurchaseReturnForm } from "./return-form";

export default async function PurchaseReturnsPage() {
  const { tenantId, userId } = await requireSession();
  const [returns, branches, warehouses, suppliers, variants, canCreate] = await Promise.all([
    listPurchaseReturns(tenantId),
    getBranchOptions(tenantId),
    listWarehouses(tenantId),
    getSupplierOptions(tenantId),
    getVariantOptions(tenantId),
    can(userId, PERMISSIONS.PURCHASE_RETURN_CREATE),
  ]);

  const ready = branches.length > 0 && warehouses.length > 0 && suppliers.length > 0 && variants.length > 0;

  return (
    <ModuleGate tenantId={tenantId} moduleKey="purchasing">
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Purchase returns</h1>

      {canCreate && ready && (
        <div className="mb-6">
          <PurchaseReturnForm branches={branches} warehouses={warehouses} suppliers={suppliers} variants={variants} />
        </div>
      )}
      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">
          Add a warehouse, a supplier and a product before posting a return.
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Doc #</th>
              <th className="px-4 py-2">Supplier</th>
              <th className="px-4 py-2">Warehouse</th>
              <th className="px-4 py-2">Reason</th>
              <th className="px-4 py-2 text-right">Lines</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{r.docNumber}</td>
                <td className="px-4 py-2">{r.supplier?.name}</td>
                <td className="px-4 py-2">{r.warehouse?.name}</td>
                <td className="px-4 py-2 capitalize">{r.reason.replace("_", " ")}</td>
                <td className="px-4 py-2 text-right">{r.lines.length}</td>
              </tr>
            ))}
            {returns.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No purchase returns yet.
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
