import { listStockOnHand, listLowStock, listWarehouses } from "@erp/core/inventory";
import { PageHeader, Card } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { PackageIcon, AlertTriangleIcon } from "@/components/icons";
import { InventoryClient } from "./inventory-client";

export default async function InventoryPage() {
  const { tenantId } = await requireSession();
  const [stock, lowStock, warehouses] = await Promise.all([
    listStockOnHand(tenantId),
    listLowStock(tenantId),
    listWarehouses(tenantId),
  ]);

  const lowStockKeys = new Set(lowStock.map((item) => `${item.warehouseId}:${item.productVariantId}`));

  return (
    <ModuleGate tenantId={tenantId} moduleKey="inventory">
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader title="Stock report" description="Current stock levels and valuation across all warehouses." icon={<PackageIcon className="h-5 w-5" />} />

      {lowStock.length > 0 && (
        <Card className="mb-6 border-warning-100 bg-warning-50 p-4">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-warning-700">
            <AlertTriangleIcon className="h-4 w-4" />
            Low stock
          </h2>
          <ul className="space-y-1 text-sm text-warning-700">
            {lowStock.map((item) => (
              <li key={`${item.warehouseId}-${item.productVariantId}`}>
                {item.sku} — {item.productName} at {item.warehouseName}: {item.onHand} on hand
                (reorder at {item.reorderLevel}, suggest ordering {item.reorderQty})
              </li>
            ))}
          </ul>
        </Card>
      )}

      <InventoryClient stock={stock} warehouses={warehouses} lowStockKeys={lowStockKeys} />
    </main>
    </ModuleGate>
  );
}
