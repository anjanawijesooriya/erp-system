import { listSalesPayments } from "@erp/core/sales";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { getBranchOptions } from "@/lib/branch-options";
import { getCustomerOptions } from "@/lib/party-options";
import { CreditCardIcon } from "@/components/icons";
import { ReceiptsClient } from "./receipt-client";

export default async function SalesPaymentsPage() {
  const { tenantId, userId } = await requireSession();
  const [payments, branches, customers, canCreate] = await Promise.all([
    listSalesPayments(tenantId),
    getBranchOptions(tenantId),
    getCustomerOptions(tenantId),
    can(userId, PERMISSIONS.SALES_PAYMENT_CREATE),
  ]);

  const ready = branches.length > 0 && customers.length > 0;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader title="Receipts" description="Money received from customers against their invoices." icon={<CreditCardIcon className="h-5 w-5" />} />

      {canCreate && !ready && <p className="mb-6 text-sm text-slate-500">Add a customer first.</p>}

      <ReceiptsClient payments={payments} branches={branches} customers={customers} canCreate={canCreate && ready} />
    </main>
  );
}
