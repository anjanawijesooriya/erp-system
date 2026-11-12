import { listGrns, listOutstandingPurchaseOrders } from "@erp/core/purchasing";
import { listWarehouses } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { getSupplierOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { PackageIcon } from "@/components/icons";
import { GrnClient } from "./grn-client";

export default async function GrnPage() {
  const { tenantId, userId } = await requireSession();
  const [grns, branches, warehouses, suppliers, variants, purchaseOrders, canCreate] = await Promise.all([
    listGrns(tenantId),
    getBranchOptions(tenantId),
    listWarehouses(tenantId),
    getSupplierOptions(tenantId),
    getVariantOptions(tenantId),
    listOutstandingPurchaseOrders(tenantId),
    can(userId, PERMISSIONS.GRN_CREATE),
  ]);

  const ready = branches.length > 0 && warehouses.length > 0 && suppliers.length > 0 && variants.length > 0;

  return (
    <ModuleGate tenantId={tenantId} moduleKey="purchasing">
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader
        title="Goods received notes"
        description="Record stock as it physically arrives, optionally against an open PO."
        icon={<PackageIcon className="h-5 w-5" />}
      />

      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">
          Add a warehouse, a supplier and a product before posting a GRN.
        </p>
      )}

      <GrnClient
        grns={grns}
        branches={branches}
        warehouses={warehouses}
        suppliers={suppliers}
        variants={variants}
        purchaseOrders={purchaseOrders}
        canCreate={canCreate && ready}
      />
    </main>
    </ModuleGate>
  );
}
