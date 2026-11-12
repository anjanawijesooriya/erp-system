import { listPurchaseOrders } from "@erp/core/purchasing";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { getSupplierOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { ReceiptIcon } from "@/components/icons";
import { PurchaseOrdersClient } from "./po-client";

export default async function PurchaseOrdersPage() {
  const { tenantId, userId } = await requireSession();
  const [orders, branches, suppliers, variants, canCreate, canCancel] = await Promise.all([
    listPurchaseOrders(tenantId),
    getBranchOptions(tenantId),
    getSupplierOptions(tenantId),
    getVariantOptions(tenantId),
    can(userId, PERMISSIONS.PURCHASE_ORDER_CREATE),
    can(userId, PERMISSIONS.PURCHASE_ORDER_CANCEL),
  ]);

  const ready = branches.length > 0 && suppliers.length > 0 && variants.length > 0;

  return (
    <ModuleGate tenantId={tenantId} moduleKey="purchasing">
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader
        title="Purchase orders"
        description="Request stock from suppliers before it's received."
        icon={<ReceiptIcon className="h-5 w-5" />}
      />

      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">
          Add a supplier and a product before creating a purchase order.
        </p>
      )}

      <PurchaseOrdersClient
        orders={orders}
        branches={branches}
        suppliers={suppliers}
        variants={variants}
        canCreate={canCreate && ready}
        canCancel={canCancel}
      />
    </main>
    </ModuleGate>
  );
}
