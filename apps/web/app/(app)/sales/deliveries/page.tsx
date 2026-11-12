import { listDeliveries } from "@erp/core/sales";
import { listWarehouses } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { getBranchOptions } from "@/lib/branch-options";
import { getCustomerOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { TruckIcon } from "@/components/icons";
import { DeliveriesClient } from "./delivery-client";

export default async function DeliveriesPage() {
  const { tenantId, userId } = await requireSession();
  const [deliveries, branches, warehouses, customers, variants, canCreate] = await Promise.all([
    listDeliveries(tenantId),
    getBranchOptions(tenantId),
    listWarehouses(tenantId),
    getCustomerOptions(tenantId),
    getVariantOptions(tenantId),
    can(userId, PERMISSIONS.DELIVERY_CREATE),
  ]);

  const ready = branches.length > 0 && warehouses.length > 0 && customers.length > 0 && variants.length > 0;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader title="Deliveries" description="Stock physically shipped out to customers." icon={<TruckIcon className="h-5 w-5" />} />

      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">Add a warehouse, a customer and a product before posting a delivery.</p>
      )}

      <DeliveriesClient
        deliveries={deliveries}
        branches={branches}
        warehouses={warehouses}
        customers={customers}
        variants={variants}
        canCreate={canCreate && ready}
      />
    </main>
  );
}
