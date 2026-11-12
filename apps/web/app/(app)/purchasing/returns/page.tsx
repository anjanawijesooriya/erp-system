import { listPurchaseReturns, listGrns } from "@erp/core/purchasing";
import { listWarehouses } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { getSupplierOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { UndoIcon } from "@/components/icons";
import { PurchaseReturnsClient } from "./return-client";

export default async function PurchaseReturnsPage() {
  const { tenantId, userId } = await requireSession();
  const [returns, branches, warehouses, suppliers, variants, grns, canCreate] = await Promise.all([
    listPurchaseReturns(tenantId),
    getBranchOptions(tenantId),
    listWarehouses(tenantId),
    getSupplierOptions(tenantId),
    getVariantOptions(tenantId),
    listGrns(tenantId),
    can(userId, PERMISSIONS.PURCHASE_RETURN_CREATE),
  ]);

  const grnOptions = grns.map((g) => ({
    id: g.id,
    docNumber: g.docNumber,
    supplierId: g.supplier?.id ?? "",
    lines: g.lines.map((l) => ({ productVariantId: l.productVariantId, receivedQty: Number(l.receivedQty), unitCost: Number(l.unitCost) })),
  }));

  const ready = branches.length > 0 && warehouses.length > 0 && suppliers.length > 0 && variants.length > 0;

  return (
    <ModuleGate tenantId={tenantId} moduleKey="purchasing">
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader
        title="Purchase returns"
        description="Send stock back to a supplier (damaged, wrong item, excess)."
        icon={<UndoIcon className="h-5 w-5" />}
      />

      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">
          Add a warehouse, a supplier and a product before posting a return.
        </p>
      )}

      <PurchaseReturnsClient
        returns={returns}
        branches={branches}
        warehouses={warehouses}
        suppliers={suppliers}
        variants={variants}
        grns={grnOptions}
        canCreate={canCreate && ready}
      />
    </main>
    </ModuleGate>
  );
}
