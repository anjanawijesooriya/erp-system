import { listStockOnHand, listLowStock } from "@erp/core/inventory";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";

export default async function InventoryPage() {
  const { tenantId } = await requireSession();
  const [stock, lowStock] = await Promise.all([listStockOnHand(tenantId), listLowStock(tenantId)]);

  return (
    <ModuleGate tenantId={tenantId} moduleKey="inventory">
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Stock on hand</h1>

      {lowStock.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-amber-800">Low stock</h2>
          <ul className="space-y-1 text-sm text-amber-900">
            {lowStock.map((item) => (
              <li key={`${item.warehouseId}-${item.productVariantId}`}>
                {item.sku} — {item.productName} at {item.warehouseName}: {item.onHand} on hand
                (reorder at {item.reorderLevel}, suggest ordering {item.reorderQty})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Warehouse</th>
              <th className="px-4 py-2.5">SKU</th>
              <th className="px-4 py-2.5">Product</th>
              <th className="px-4 py-2.5 text-right">Qty</th>
              <th className="px-4 py-2.5 text-right">Avg cost</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((row) => (
              <tr key={`${row.warehouseId}-${row.productVariantId}`} className="border-t border-slate-100">
                <td className="px-4 py-2.5">{row.warehouseName}</td>
                <td className="px-4 py-2.5">{row.sku}</td>
                <td className="px-4 py-2.5">{row.productName}</td>
                <td className="px-4 py-2.5 text-right">{Number(row.quantity).toFixed(2)}</td>
                <td className="px-4 py-2.5 text-right">{Number(row.averageCost).toFixed(2)}</td>
              </tr>
            ))}
            {stock.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No stock movements yet.
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
