import { listTransfers, listWarehouses } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getVariantOptions } from "@/lib/product-options";
import { SwapIcon } from "@/components/icons";
import { TransfersClient } from "./transfer-client";

export default async function TransfersPage() {
  const { tenantId, userId } = await requireSession();
  const [transfers, warehouses, variants, canTransfer] = await Promise.all([
    listTransfers(tenantId),
    listWarehouses(tenantId),
    getVariantOptions(tenantId),
    can(userId, PERMISSIONS.STOCK_TRANSFER),
  ]);

  return (
    <ModuleGate tenantId={tenantId} moduleKey="inventory">
    <main className="mx-auto max-w-4xl p-8">
      <PageHeader title="Stock transfers" description="Move stock between warehouses." icon={<SwapIcon className="h-5 w-5" />} />

      {canTransfer && (warehouses.length < 2 || variants.length === 0) && (
        <p className="mb-6 text-sm text-slate-500">
          Add at least two warehouses and one product before creating a transfer.
        </p>
      )}

      <TransfersClient
        transfers={transfers}
        warehouses={warehouses}
        variants={variants}
        canCreate={canTransfer && warehouses.length >= 2 && variants.length > 0}
      />
    </main>
    </ModuleGate>
  );
}
