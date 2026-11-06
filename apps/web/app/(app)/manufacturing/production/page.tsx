import { listBoms, listProductionOrders } from "@erp/core/manufacturing";
import { listWarehouses } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { ProductionOrderForm } from "./production-form";
import { OrderActions } from "./order-actions";

export default async function ProductionPage() {
  const { tenantId, userId } = await requireSession();
  const [orders, branches, warehouses, boms, canManage] = await Promise.all([
    listProductionOrders(tenantId),
    getBranchOptions(tenantId),
    listWarehouses(tenantId),
    listBoms(tenantId),
    can(userId, PERMISSIONS.PRODUCTION_ORDER_MANAGE),
  ]);

  const bomOptions = boms.map((b) => ({ id: b.id, label: `${b.name} → ${b.outputVariant.sku}` }));

  return (
    <ModuleGate tenantId={tenantId} moduleKey="manufacturing">
      <main className="mx-auto max-w-4xl p-8">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Production orders</h1>

        {canManage && (
          <div className="mb-6">
            <ProductionOrderForm branches={branches} warehouses={warehouses} boms={bomOptions} />
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">BOM</th>
                <th className="px-4 py-2.5">Branch / warehouse</th>
                <th className="px-4 py-2.5">Planned batches</th>
                <th className="px-4 py-2.5">Actual output</th>
                <th className="px-4 py-2.5">Status</th>
                {canManage && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5">
                    {o.bom.name} → {o.bom.outputVariant.sku}
                  </td>
                  <td className="px-4 py-2.5">
                    {o.branch?.name} / {o.warehouse?.name}
                  </td>
                  <td className="px-4 py-2.5">{o.plannedBatches}</td>
                  <td className="px-4 py-2.5">{o.actualOutputQuantity ?? "—"}</td>
                  <td className="px-4 py-2.5 capitalize">{o.status}</td>
                  {canManage && (
                    <td className="px-4 py-2.5">
                      {o.status === "draft" && (
                        <OrderActions productionOrderId={o.id} plannedBatches={Number(o.plannedBatches)} />
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="px-4 py-8 text-center text-slate-400">
                    No production orders yet.
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
