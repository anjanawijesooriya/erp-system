import { listAdjustments, listWarehouses } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getVariantOptions } from "@/lib/product-options";
import { AdjustmentForm } from "./adjustment-form";

export default async function AdjustmentsPage() {
  const { tenantId, userId } = await requireSession();
  const [adjustments, warehouses, variants, canAdjust] = await Promise.all([
    listAdjustments(tenantId),
    listWarehouses(tenantId),
    getVariantOptions(tenantId),
    can(userId, PERMISSIONS.STOCK_ADJUST),
  ]);

  return (
    <ModuleGate tenantId={tenantId} moduleKey="inventory">
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Stock adjustments</h1>

      {canAdjust && warehouses.length > 0 && variants.length > 0 && (
        <div className="mb-6">
          <AdjustmentForm warehouses={warehouses} variants={variants} />
        </div>
      )}
      {canAdjust && (warehouses.length === 0 || variants.length === 0) && (
        <p className="mb-6 text-sm text-slate-500">
          Add at least one warehouse and one product before posting an adjustment.
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Warehouse</th>
              <th className="px-4 py-2.5">Reason</th>
              <th className="px-4 py-2.5">Note</th>
              <th className="px-4 py-2.5 text-right">Lines</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-4 py-2.5">{new Date(a.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2.5">{a.warehouse?.name}</td>
                <td className="px-4 py-2.5 capitalize">{a.reason.replace("_", " ")}</td>
                <td className="px-4 py-2.5">{a.note ?? "—"}</td>
                <td className="px-4 py-2.5 text-right">{a.lines.length}</td>
              </tr>
            ))}
            {adjustments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No adjustments yet.
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
