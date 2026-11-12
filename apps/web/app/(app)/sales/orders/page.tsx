import { listSalesOrders } from "@erp/core/sales";
import { listStockOnHand } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { getBranchOptions } from "@/lib/branch-options";
import { getCustomerOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { StoreIcon } from "@/components/icons";
import { SalesOrdersClient } from "./order-client";

export default async function SalesOrdersPage() {
  const { tenantId, userId } = await requireSession();
  const [orders, branches, customers, variants, stock, canCreate, canCancel] = await Promise.all([
    listSalesOrders(tenantId),
    getBranchOptions(tenantId),
    getCustomerOptions(tenantId),
    getVariantOptions(tenantId),
    listStockOnHand(tenantId),
    can(userId, PERMISSIONS.SALES_ORDER_CREATE),
    can(userId, PERMISSIONS.SALES_ORDER_CANCEL),
  ]);

  const availableByVariant = new Map<string, number>();
  for (const row of stock) {
    availableByVariant.set(row.productVariantId, (availableByVariant.get(row.productVariantId) ?? 0) + Number(row.quantity));
  }
  const availability = Array.from(availableByVariant, ([productVariantId, available]) => ({ productVariantId, available }));

  const ready = branches.length > 0 && customers.length > 0 && variants.length > 0;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader title="Sales orders" description="Confirmed orders waiting to be invoiced and shipped." icon={<StoreIcon className="h-5 w-5" />} />

      {canCreate && !ready && <p className="mb-6 text-sm text-slate-500">Add a customer and a product before ordering.</p>}

      <SalesOrdersClient
        orders={orders}
        branches={branches}
        customers={customers}
        variants={variants}
        availability={availability}
        canCreate={canCreate && ready}
        canCancel={canCancel}
      />
    </main>
  );
}
