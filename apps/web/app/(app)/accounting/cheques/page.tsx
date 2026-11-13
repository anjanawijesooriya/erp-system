import { listCheques } from "@erp/core/accounting";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { getCustomerOptions, getSupplierOptions } from "@/lib/party-options";
import { CreditCardIcon } from "@/components/icons";
import { ChequesClient } from "./cheques-client";

export default async function ChequesPage() {
  const { tenantId, userId } = await requireSession();
  const [cheques, branches, customers, suppliers, canManage] = await Promise.all([
    listCheques(tenantId),
    getBranchOptions(tenantId),
    getCustomerOptions(tenantId),
    getSupplierOptions(tenantId),
    can(userId, PERMISSIONS.CHEQUE_MANAGE),
  ]);

  const rows = cheques.map((c) => ({
    id: c.id,
    chequeNumber: c.chequeNumber,
    direction: c.direction,
    partyName: c.customer?.name ?? c.supplier?.name ?? "—",
    chequeDate: c.chequeDate,
    amount: c.amount,
    bankName: c.bankName,
    status: c.status,
  }));

  return (
    <ModuleGate tenantId={tenantId} moduleKey="accounting">
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader
        title="Cheques register"
        description="Track issued and received cheques through to clearing."
        icon={<CreditCardIcon className="h-5 w-5" />}
      />

      <ChequesClient cheques={rows} branches={branches} customers={customers} suppliers={suppliers} canManage={canManage} />
    </main>
    </ModuleGate>
  );
}
