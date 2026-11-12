import { listStockCounts, listWarehouses, listStockOnHand } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getVariantOptions } from "@/lib/product-options";
import { ClipboardIcon } from "@/components/icons";
import { StockCountsClient } from "./count-client";

export default async function StockCountsPage() {
  const { tenantId, userId } = await requireSession();
  const [counts, warehouses, variants, stock, canManage] = await Promise.all([
    listStockCounts(tenantId),
    listWarehouses(tenantId),
    getVariantOptions(tenantId),
    listStockOnHand(tenantId),
    can(userId, PERMISSIONS.STOCK_COUNT_MANAGE),
  ]);

  const stockRows = stock.map((s) => ({ warehouseId: s.warehouseId, productVariantId: s.productVariantId, quantity: Number(s.quantity) }));

  return (
    <ModuleGate tenantId={tenantId} moduleKey="inventory">
    <main className="mx-auto max-w-4xl p-8">
      <PageHeader title="Stock counts" description="Reconcile physical stock against the system." icon={<ClipboardIcon className="h-5 w-5" />} />

      {canManage && (warehouses.length === 0 || variants.length === 0) && (
        <p className="mb-6 text-sm text-slate-500">
          Add at least one warehouse and one product before submitting a stock count.
        </p>
      )}

      <StockCountsClient
        counts={counts}
        warehouses={warehouses}
        variants={variants}
        stock={stockRows}
        canCreate={canManage && warehouses.length > 0 && variants.length > 0}
      />
    </main>
    </ModuleGate>
  );
}
