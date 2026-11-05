import { listSupplierInvoices } from "@erp/core/purchasing";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { AppNav } from "@/components/app-nav";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { getSupplierOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { SupplierInvoiceForm } from "./invoice-form";

export default async function SupplierInvoicesPage() {
  const { tenantId, userId } = await requireSession();
  const [invoices, branches, suppliers, variants, canCreate] = await Promise.all([
    listSupplierInvoices(tenantId),
    getBranchOptions(tenantId),
    getSupplierOptions(tenantId),
    getVariantOptions(tenantId),
    can(userId, PERMISSIONS.SUPPLIER_INVOICE_CREATE),
  ]);

  const ready = branches.length > 0 && suppliers.length > 0 && variants.length > 0;

  return (
    <ModuleGate tenantId={tenantId} moduleKey="purchasing">
    <main className="mx-auto max-w-5xl p-8">
      <AppNav />
      <h1 className="mb-4 text-xl font-semibold">Supplier invoices</h1>

      {canCreate && ready && (
        <div className="mb-6">
          <SupplierInvoiceForm branches={branches} suppliers={suppliers} variants={variants} />
        </div>
      )}
      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">
          Add a supplier and a product before recording an invoice.
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Doc #</th>
              <th className="px-4 py-2">Supplier</th>
              <th className="px-4 py-2">Due date</th>
              <th className="px-4 py-2 text-right">Total</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{i.docNumber}</td>
                <td className="px-4 py-2">{i.supplier?.name}</td>
                <td className="px-4 py-2">{i.dueDate}</td>
                <td className="px-4 py-2 text-right">{i.totalAmount}</td>
                <td className="px-4 py-2 capitalize">{i.status.replace("_", " ")}</td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No supplier invoices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
    </ModuleGate>
  );
}
