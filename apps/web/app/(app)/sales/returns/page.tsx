import { listSalesReturns, listSalesInvoices } from "@erp/core/sales";
import { listWarehouses } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { getBranchOptions } from "@/lib/branch-options";
import { getCustomerOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { UndoIcon } from "@/components/icons";
import { SalesReturnsClient } from "./return-client";

export default async function SalesReturnsPage() {
  const { tenantId, userId } = await requireSession();
  const [returns, branches, warehouses, customers, variants, invoices, canCreate] = await Promise.all([
    listSalesReturns(tenantId),
    getBranchOptions(tenantId),
    listWarehouses(tenantId),
    getCustomerOptions(tenantId),
    getVariantOptions(tenantId),
    listSalesInvoices(tenantId),
    can(userId, PERMISSIONS.SALES_RETURN_CREATE),
  ]);

  const invoiceOptions = invoices.map((inv) => ({
    id: inv.id,
    docNumber: inv.docNumber,
    customerId: inv.customerId,
    lines: inv.lines.map((l) => ({ productVariantId: l.productVariantId, qty: Number(l.qty), unitPrice: Number(l.unitPrice) })),
  }));

  const ready = branches.length > 0 && warehouses.length > 0 && customers.length > 0 && variants.length > 0;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader title="Sales returns" description="Stock customers send back (damaged, wrong item, changed mind)." icon={<UndoIcon className="h-5 w-5" />} />

      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">Add a warehouse, a customer and a product before posting a return.</p>
      )}

      <SalesReturnsClient
        returns={returns}
        branches={branches}
        warehouses={warehouses}
        customers={customers}
        variants={variants}
        invoices={invoiceOptions}
        canCreate={canCreate && ready}
      />
    </main>
  );
}
