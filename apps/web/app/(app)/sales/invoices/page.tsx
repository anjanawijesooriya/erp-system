import Link from "next/link";
import { listSalesInvoices } from "@erp/core/sales";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { SalesDocForm } from "@/components/sales-doc-form";
import { getBranchOptions } from "@/lib/branch-options";
import { getCustomerOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { createSalesInvoiceAction } from "./actions";

const STATUS_BADGE: Record<string, string> = {
  paid: "bg-accent-100 text-accent-700",
  unpaid: "bg-amber-100 text-amber-700",
  partially_paid: "bg-sky-100 text-sky-700",
  void: "bg-slate-200 text-slate-500",
};

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
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sales invoices</h1>

      {canCreate && ready && (
        <div className="mt-6">
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
        <p className="mt-6 text-sm text-slate-500">Add a customer and a product before invoicing.</p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Doc #</th>
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Due date</th>
              <th className="px-4 py-2.5 text-right">Total</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-t border-slate-100">
                <td className="px-4 py-2.5 font-medium text-slate-900">{i.docNumber}</td>
                <td className="px-4 py-2.5">{i.customer?.name}</td>
                <td className="px-4 py-2.5">{i.dueDate}</td>
                <td className="px-4 py-2.5 text-right">{Number(i.totalAmount).toLocaleString()}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[i.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {i.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/sales/invoices/${i.id}`} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                    View / Print
                  </Link>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
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
