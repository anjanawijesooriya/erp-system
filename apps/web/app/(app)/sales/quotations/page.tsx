import { listQuotations } from "@erp/core/sales";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { getBranchOptions } from "@/lib/branch-options";
import { getCustomerOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { ReceiptIcon } from "@/components/icons";
import { QuotationsClient } from "./quotation-client";

export default async function QuotationsPage() {
  const { tenantId, userId } = await requireSession();
  const [quotations, branches, customers, variants, canCreate, canCancel] = await Promise.all([
    listQuotations(tenantId),
    getBranchOptions(tenantId),
    getCustomerOptions(tenantId),
    getVariantOptions(tenantId),
    can(userId, PERMISSIONS.QUOTATION_CREATE),
    can(userId, PERMISSIONS.QUOTATION_CANCEL),
  ]);

  const ready = branches.length > 0 && customers.length > 0 && variants.length > 0;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader title="Quotations" description="Quote a customer before they commit to an order." icon={<ReceiptIcon className="h-5 w-5" />} />

      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">Add a customer and a product before quoting.</p>
      )}

      <QuotationsClient
        quotations={quotations}
        branches={branches}
        customers={customers}
        variants={variants}
        canCreate={canCreate && ready}
        canCancel={canCancel}
      />
    </main>
  );
}
