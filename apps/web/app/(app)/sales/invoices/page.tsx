import { listSalesInvoices } from "@erp/core/sales";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { getBranchOptions } from "@/lib/branch-options";
import { getCustomerOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { ReceiptIcon } from "@/components/icons";
import { SalesInvoicesClient } from "./invoice-client";

export default async function SalesInvoicesPage() {
  const { tenantId, userId } = await requireSession();
  const [invoices, branches, customers, variants, canCreate] = await Promise.all([
    listSalesInvoices(tenantId),
    getBranchOptions(tenantId),
    getCustomerOptions(tenantId),
    getVariantOptions(tenantId),
    can(userId, PERMISSIONS.SALES_INVOICE_CREATE),
  ]);

  const ready = branches.length > 0 && customers.length > 0 && variants.length > 0;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader title="Sales invoices" description="Bills sent to customers." icon={<ReceiptIcon className="h-5 w-5" />} />

      {canCreate && !ready && <p className="mb-6 text-sm text-slate-500">Add a customer and a product before invoicing.</p>}

      <SalesInvoicesClient
        invoices={invoices}
        branches={branches}
        customers={customers}
        variants={variants}
        canCreate={canCreate && ready}
      />
    </main>
  );
}
