import { listSupplierInvoices, listUninvoicedGrns } from "@erp/core/purchasing";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { getSupplierOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { ReceiptIcon } from "@/components/icons";
import { SupplierInvoicesClient } from "./invoice-client";

export default async function SupplierInvoicesPage() {
  const { tenantId, userId } = await requireSession();
  const [invoices, branches, suppliers, variants, grns, canCreate, canCancel] = await Promise.all([
    listSupplierInvoices(tenantId),
    getBranchOptions(tenantId),
    getSupplierOptions(tenantId),
    getVariantOptions(tenantId),
    listUninvoicedGrns(tenantId),
    can(userId, PERMISSIONS.SUPPLIER_INVOICE_CREATE),
    can(userId, PERMISSIONS.SUPPLIER_INVOICE_CANCEL),
  ]);

  const ready = branches.length > 0 && suppliers.length > 0 && variants.length > 0;

  return (
    <ModuleGate tenantId={tenantId} moduleKey="purchasing">
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader
        title="Supplier invoices"
        description="Bills owed to suppliers, optionally linked to a GRN."
        icon={<ReceiptIcon className="h-5 w-5" />}
      />

      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">
          Add a supplier and a product before recording an invoice.
        </p>
      )}

      <SupplierInvoicesClient
        invoices={invoices}
        branches={branches}
        suppliers={suppliers}
        variants={variants}
        grns={grns}
        canCreate={canCreate && ready}
        canCancel={canCancel}
      />
    </main>
    </ModuleGate>
  );
}
