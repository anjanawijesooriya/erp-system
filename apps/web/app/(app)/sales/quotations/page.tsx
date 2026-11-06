import { listQuotations } from "@erp/core/sales";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { SalesDocForm } from "@/components/sales-doc-form";
import { getBranchOptions } from "@/lib/branch-options";
import { getCustomerOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { createQuotationAction } from "./actions";

export default async function QuotationsPage() {
  const { tenantId, userId } = await requireSession();
  const [quotations, branches, customers, variants, canCreate] = await Promise.all([
    listQuotations(tenantId),
    getBranchOptions(tenantId),
    getCustomerOptions(tenantId),
    getVariantOptions(tenantId),
    can(userId, PERMISSIONS.QUOTATION_CREATE),
  ]);

  const ready = branches.length > 0 && customers.length > 0 && variants.length > 0;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Quotations</h1>

      {canCreate && ready && (
        <div className="mb-6">
          <SalesDocForm
            action={createQuotationAction}
            branches={branches}
            customers={customers}
            variants={variants}
            dateFieldName="quoteDate"
            dateLabel="Quote date"
            submitLabel="Create quotation"
            showValidUntil
          />
        </div>
      )}
      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">Add a customer and a product before quoting.</p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Doc #</th>
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Quote date</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Lines</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map((q) => (
              <tr key={q.id} className="border-t border-slate-100">
                <td className="px-4 py-2.5">{q.docNumber}</td>
                <td className="px-4 py-2.5">{q.customer?.name}</td>
                <td className="px-4 py-2.5">{q.quoteDate}</td>
                <td className="px-4 py-2.5 capitalize">{q.status}</td>
                <td className="px-4 py-2.5 text-right">{q.lines.length}</td>
              </tr>
            ))}
            {quotations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No quotations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
