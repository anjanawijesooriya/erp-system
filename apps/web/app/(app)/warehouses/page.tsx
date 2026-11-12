import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { branches } from "@erp/db/schema";
import { listWarehouses, listStockOnHand, listTransfers } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { BuildingIcon } from "@/components/icons";
import { WarehousesClient } from "./warehouses-client";

export default async function WarehousesPage() {
  const { tenantId, userId } = await requireSession();
  const [warehouses, tenantBranches, stock, transfers, canManage] = await Promise.all([
    listWarehouses(tenantId),
    db.query.branches.findMany({ where: eq(branches.tenantId, tenantId) }),
    listStockOnHand(tenantId),
    listTransfers(tenantId),
    can(userId, PERMISSIONS.WAREHOUSE_MANAGE),
  ]);

  const sortedWarehouses = [...warehouses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const warehouseStats = sortedWarehouses.map((w, i) => {
    const rows = stock.filter((s) => s.warehouseId === w.id && Number(s.quantity) > 0);
    return {
      id: w.id,
      name: w.name,
      code: w.code,
      branchName: w.branch?.name ?? "—",
      isDefault: i === 0,
      skuCount: rows.length,
      stockValue: rows.reduce((sum, r) => sum + Number(r.quantity) * Number(r.averageCost), 0),
    };
  });

  const totalStockValue = warehouseStats.reduce((sum, w) => sum + w.stockValue, 0);

  const recentTransfers = transfers.slice(0, 5).map((t) => ({
    id: t.id,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
    status: t.status,
    lineCount: t.lines.length,
    fromWarehouseName: t.fromWarehouse?.name ?? "—",
    toWarehouseName: t.toWarehouse?.name ?? "—",
  }));

  return (
    <ModuleGate tenantId={tenantId} moduleKey="inventory">
    <main className="mx-auto max-w-6xl p-8">
      <PageHeader
        title="Warehouses & branches"
        description={`${warehouses.length} location${warehouses.length === 1 ? "" : "s"} · ${totalStockValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} stock value across all sites`}
        icon={<BuildingIcon className="h-5 w-5" />}
      />

      <WarehousesClient
        warehouseStats={warehouseStats}
        recentTransfers={recentTransfers}
        branches={tenantBranches}
        canManage={canManage}
      />
    </main>
    </ModuleGate>
  );
}
