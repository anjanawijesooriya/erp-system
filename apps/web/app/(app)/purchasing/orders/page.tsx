import { listPurchaseOrders } from "@erp/core/purchasing";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { getSupplierOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { PurchaseOrderForm } from "./po-form";

export default async function PurchaseOrdersPage() {
  const { tenantId, userId } = await requireSession();
  const [orders, branches, suppliers, variants, canCreate] = await Promise.all([
    listPurchaseOrders(tenantId),
    getBranchOptions(tenantId),
    getSupplierOptions(tenantId),
    getVariantOptions(tenantId),
    can(userId, PERMISSIONS.PURCHASE_ORDER_CREATE),
  ]);

  const ready = branches.length > 0 && suppliers.length > 0 && variants.length > 0;

  return (
    <ModuleGate tenantId={tenantId} moduleKey="purchasing">
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Purchase orders</h1>

      {canCreate && ready && (
        <div className="mb-6">
          <PurchaseOrderForm branches={branches} suppliers={suppliers} variants={variants} />
        </div>
      )}
      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">
          Add a supplier and a product before creating a purchase order.
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Doc #</th>
              <th className="px-4 py-2.5">Supplier</th>
              <th className="px-4 py-2.5">Order date</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Lines</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-2.5">{o.docNumber}</td>
                <td className="px-4 py-2.5">{o.supplier?.name}</td>
                <td className="px-4 py-2.5">{o.orderDate}</td>
                <td className="px-4 py-2.5 capitalize">{o.status}</td>
                <td className="px-4 py-2.5 text-right">{o.lines.length}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No purchase orders yet.
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
