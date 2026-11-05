import { listGrns } from "@erp/core/purchasing";
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
  const [grns, branches, warehouses, suppliers, variants, canCreate] = await Promise.all([
    listGrns(tenantId),
    getBranchOptions(tenantId),
    listWarehouses(tenantId),
    getSupplierOptions(tenantId),
    getVariantOptions(tenantId),
    can(userId, PERMISSIONS.GRN_CREATE),
  ]);

  const ready = branches.length > 0 && warehouses.length > 0 && suppliers.length > 0 && variants.length > 0;

  return (
    <ModuleGate tenantId={tenantId} moduleKey="purchasing">
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Goods received notes</h1>

      {canCreate && ready && (
        <div className="mb-6">
          <GrnForm branches={branches} warehouses={warehouses} suppliers={suppliers} variants={variants} />
        </div>
      )}
      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">
          Add a warehouse, a supplier and a product before posting a GRN.
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Doc #</th>
              <th className="px-4 py-2">Supplier</th>
              <th className="px-4 py-2">Warehouse</th>
              <th className="px-4 py-2">Received</th>
              <th className="px-4 py-2 text-right">Lines</th>
            </tr>
          </thead>
          <tbody>
            {grns.map((g) => (
              <tr key={g.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{g.docNumber}</td>
                <td className="px-4 py-2">{g.supplier?.name}</td>
                <td className="px-4 py-2">{g.warehouse?.name}</td>
                <td className="px-4 py-2">{g.receivedDate}</td>
                <td className="px-4 py-2 text-right">{g.lines.length}</td>
              </tr>
            ))}
            {grns.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
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
