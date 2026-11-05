import { listSalesInvoices } from "@erp/core/sales";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { SalesDocForm } from "@/components/sales-doc-form";
import { getBranchOptions } from "@/lib/branch-options";
import { getCustomerOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { createSalesInvoiceAction } from "./actions";

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
      <h1 className="mb-4 text-xl font-semibold">Sales invoices</h1>

      {canCreate && ready && (
        <div className="mb-6">
          <SalesDocForm
            action={createSalesInvoiceAction}
            branches={branches}
            customers={customers}
            variants={variants}
            dateFieldName="invoiceDate"
            dateLabel="Invoice date"
            submitLabel="Record invoice"
            helperText="Due date is calculated automatically from the customer's credit terms. This does not move stock — post a delivery separately."
          />
        </div>
      )}
      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">Add a customer and a product before invoicing.</p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Doc #</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Due date</th>
              <th className="px-4 py-2 text-right">Total</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{i.docNumber}</td>
                <td className="px-4 py-2">{i.customer?.name}</td>
                <td className="px-4 py-2">{i.dueDate}</td>
                <td className="px-4 py-2 text-right">{i.totalAmount}</td>
                <td className="px-4 py-2 capitalize">{i.status.replace("_", " ")}</td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No sales invoices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
