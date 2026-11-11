import { listGrns, listOutstandingPurchaseOrders } from "@erp/core/purchasing";
import { listWarehouses } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { getSupplierOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { GrnForm } from "./grn-form";

export default async function GrnPage() {
  const { tenantId, userId } = await requireSession();
  const [grns, branches, warehouses, suppliers, variants, purchaseOrders, canCreate] = await Promise.all([
    listGrns(tenantId),
    getBranchOptions(tenantId),
    listWarehouses(tenantId),
    getSupplierOptions(tenantId),
    getVariantOptions(tenantId),
    listOutstandingPurchaseOrders(tenantId),
    can(userId, PERMISSIONS.GRN_CREATE),
  ]);

  const ready = branches.length > 0 && warehouses.length > 0 && suppliers.length > 0 && variants.length > 0;

  return (
    <ModuleGate tenantId={tenantId} moduleKey="purchasing">
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Goods received notes</h1>

      {canCreate && ready && (
        <div className="mb-6">
          <GrnForm
            branches={branches}
            warehouses={warehouses}
            suppliers={suppliers}
            variants={variants}
            purchaseOrders={purchaseOrders}
          />
        </div>
      )}
      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">
          Add a warehouse, a supplier and a product before posting a GRN.
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Doc #</th>
              <th className="px-4 py-2.5">Supplier</th>
              <th className="px-4 py-2.5">Warehouse</th>
              <th className="px-4 py-2.5">Linked PO</th>
              <th className="px-4 py-2.5">Received</th>
              <th className="px-4 py-2.5 text-right">Lines</th>
            </tr>
          </thead>
          <tbody>
            {grns.map((g) => (
              <tr key={g.id} className="border-t border-slate-100">
                <td className="px-4 py-2.5">{g.docNumber}</td>
                <td className="px-4 py-2.5">{g.supplier?.name}</td>
                <td className="px-4 py-2.5">{g.warehouse?.name}</td>
                <td className="px-4 py-2.5 text-slate-500">{g.purchaseOrder?.docNumber ?? "—"}</td>
                <td className="px-4 py-2.5">{g.receivedDate}</td>
                <td className="px-4 py-2.5 text-right">{g.lines.length}</td>
              </tr>
            ))}
            {grns.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No GRNs yet.
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
