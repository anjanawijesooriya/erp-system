import { listSupplierPayments, listPayablesAging } from "@erp/core/purchasing";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { getSupplierOptions } from "@/lib/party-options";
import { CreditCardIcon } from "@/components/icons";
import { SupplierPaymentsClient } from "./payment-client";

export default async function SupplierPaymentsPage() {
  const { tenantId, userId } = await requireSession();
  const [payments, branches, suppliers, outstanding, canCreate] = await Promise.all([
    listSupplierPayments(tenantId),
    getBranchOptions(tenantId),
    getSupplierOptions(tenantId),
    listPayablesAging(tenantId),
    can(userId, PERMISSIONS.SUPPLIER_PAYMENT_CREATE),
  ]);

  const ready = branches.length > 0 && suppliers.length > 0;

  return (
    <ModuleGate tenantId={tenantId} moduleKey="purchasing">
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader
        title="Supplier payments"
        description="Pay down what's owed on open supplier invoices."
        icon={<CreditCardIcon className="h-5 w-5" />}
      />

      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">Add a supplier before recording a payment.</p>
      )}

      <SupplierPaymentsClient
        payments={payments}
        branches={branches}
        suppliers={suppliers}
        outstanding={outstanding}
        canCreate={canCreate && ready}
      />
    </main>
    </ModuleGate>
  );
}
