import { listStockOnHand, listLowStock } from "@erp/core/inventory";
import { PageHeader, Card, EmptyState } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { PackageIcon, AlertTriangleIcon } from "@/components/icons";

export default async function InventoryPage() {
  const { tenantId } = await requireSession();
  const [stock, lowStock] = await Promise.all([listStockOnHand(tenantId), listLowStock(tenantId)]);

  return (
    <ModuleGate tenantId={tenantId} moduleKey="inventory">
    <main className="mx-auto max-w-4xl p-8">
      <PageHeader title="Stock on hand" description="Current quantity and weighted-average cost by warehouse." icon={<PackageIcon className="h-5 w-5" />} />

      {lowStock.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50 p-4">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
            <AlertTriangleIcon className="h-4 w-4" />
            Low stock
          </h2>
          <ul className="space-y-1 text-sm text-amber-900">
            {lowStock.map((item) => (
              <li key={`${item.warehouseId}-${item.productVariantId}`}>
                {item.sku} — {item.productName} at {item.warehouseName}: {item.onHand} on hand
                (reorder at {item.reorderLevel}, suggest ordering {item.reorderQty})
              </li>
            ))}
          </ul>
        </Card>
      )}

      {stock.length === 0 ? (
        <Card>
          <EmptyState icon={<PackageIcon className="h-5 w-5" />} title="No stock movements yet." description="Stock will show up here once a GRN, transfer, or adjustment is posted." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
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
                <tr key={`${row.warehouseId}-${row.productVariantId}`} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 text-slate-600">{row.warehouseName}</td>
                  <td className="px-4 py-2.5 text-slate-500">{row.sku}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{row.productName}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{Number(row.quantity).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{Number(row.averageCost).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </main>
    </ModuleGate>
  );
}
