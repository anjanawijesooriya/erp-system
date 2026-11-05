import { listStockCounts, listWarehouses } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getVariantOptions } from "@/lib/product-options";
import { StockCountForm } from "./stock-count-form";

export default async function StockCountsPage() {
  const { tenantId, userId } = await requireSession();
  const [counts, warehouses, variants, canManage] = await Promise.all([
    listStockCounts(tenantId),
    listWarehouses(tenantId),
    getVariantOptions(tenantId),
    can(userId, PERMISSIONS.STOCK_COUNT_MANAGE),
  ]);

  return (
    <ModuleGate tenantId={tenantId} moduleKey="inventory">
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Stock counts</h1>

      {canManage && warehouses.length > 0 && variants.length > 0 && (
        <div className="mb-6">
          <StockCountForm warehouses={warehouses} variants={variants} />
        </div>
      )}
      {canManage && (warehouses.length === 0 || variants.length === 0) && (
        <p className="mb-6 text-sm text-slate-500">
          Add at least one warehouse and one product before submitting a stock count.
        </p>
      )}

      <div className="space-y-4">
        {counts.map((c) => (
          <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <div className="mb-2 flex items-center justify-between">
              <span>
                {c.warehouse?.name} · {new Date(c.createdAt).toLocaleString()}
              </span>
              <span className="capitalize text-slate-500">{c.status}</span>
            </div>
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1">Product</th>
                  <th className="py-1 text-right">System qty</th>
                  <th className="py-1 text-right">Counted qty</th>
                  <th className="py-1 text-right">Variance</th>
                </tr>
              </thead>
              <tbody>
                {c.lines.map((line) => {
                  const variance = Number(line.countedQuantity) - Number(line.systemQuantity);
                  return (
                    <tr key={line.id} className="border-t border-slate-100">
                      <td className="py-1">{line.productVariant?.sku}</td>
                      <td className="py-1 text-right">{line.systemQuantity}</td>
                      <td className="py-1 text-right">{line.countedQuantity}</td>
                      <td
                        className={`py-1 text-right ${variance !== 0 ? "font-medium text-amber-600" : ""}`}
                      >
                        {variance > 0 ? "+" : ""}
                        {variance}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
        {counts.length === 0 && <p className="text-sm text-slate-400">No stock counts yet.</p>}
      </div>
    </main>
    </ModuleGate>
  );
}
