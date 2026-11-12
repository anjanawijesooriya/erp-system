import { listAdjustments, listWarehouses } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getVariantOptions } from "@/lib/product-options";
import { AlertTriangleIcon } from "@/components/icons";
import { AdjustmentsClient } from "./adjustment-client";

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
      <PageHeader title="Stock adjustments" description="Correct stock for damage, loss, expiry, or an error." icon={<AlertTriangleIcon className="h-5 w-5" />} />

      {canAdjust && (warehouses.length === 0 || variants.length === 0) && (
        <p className="mb-6 text-sm text-slate-500">
          Add at least one warehouse and one product before posting an adjustment.
        </p>
      )}

      <AdjustmentsClient
        adjustments={adjustments}
        warehouses={warehouses}
        variants={variants}
        canCreate={canAdjust && warehouses.length > 0 && variants.length > 0}
      />
    </main>
    </ModuleGate>
  );
}
