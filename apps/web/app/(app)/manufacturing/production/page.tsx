import { listBoms, listProductionOrders } from "@erp/core/manufacturing";
import { listWarehouses, listStockOnHand } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { ClipboardIcon } from "@/components/icons";
import { ProductionClient } from "./production-client";

export default async function ProductionPage() {
  const { tenantId, userId } = await requireSession();
  const [orders, branches, warehouses, boms, stock, canManage] = await Promise.all([
    listProductionOrders(tenantId),
    getBranchOptions(tenantId),
    listWarehouses(tenantId),
    listBoms(tenantId),
    listStockOnHand(tenantId),
    can(userId, PERMISSIONS.PRODUCTION_ORDER_MANAGE),
  ]);

  const bomOptions = boms.map((b) => ({ id: b.id, label: `${b.name} → ${b.outputVariant.sku}` }));
  const bomById = new Map(boms.map((b) => [b.id, b]));

  const availableFor = (warehouseId: string, productVariantId: string) =>
    stock.find((s) => s.warehouseId === warehouseId && s.productVariantId === productVariantId)?.quantity ?? "0";

  const rows = orders.map((o) => {
    const bom = bomById.get(o.bomId);
    const batches = Number(o.plannedBatches);
    const components = (bom?.lines ?? []).map((l) => ({
      componentName: l.componentVariant.name,
      componentSku: l.componentVariant.sku,
      required: Number(l.quantity) * batches,
      available: Number(availableFor(o.warehouseId, l.componentVariantId)),
    }));
    const materialCost = (bom?.lines ?? []).reduce(
      (sum, l) => sum + Number(l.quantity) * batches * Number(l.componentVariant.costPrice),
      0,
    );

    return {
      id: o.id,
      bomName: o.bom.name,
      outputSku: o.bom.outputVariant.sku,
      branchName: o.branch?.name ?? "—",
      warehouseName: o.warehouse?.name ?? "—",
      plannedBatches: o.plannedBatches,
      actualOutputQuantity: o.actualOutputQuantity,
      status: o.status,
      createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
      materialCost,
      components,
    };
  });

  return (
    <ModuleGate tenantId={tenantId} moduleKey="manufacturing">
      <main className="mx-auto max-w-5xl p-8">
        <PageHeader
          title="Production orders"
          description="Build finished goods from a BOM, consuming raw material stock."
          icon={<ClipboardIcon className="h-5 w-5" />}
        />

        <ProductionClient orders={rows} branches={branches} warehouses={warehouses} boms={bomOptions} canManage={canManage} />
      </main>
    </ModuleGate>
  );
}
