import { listSalesPayments } from "@erp/core/sales";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { AppNav } from "@/components/app-nav";
import { getBranchOptions } from "@/lib/branch-options";
import { getCustomerOptions } from "@/lib/party-options";
import { SalesPaymentForm } from "./payment-form";

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
      <AppNav />
      <h1 className="mb-4 text-xl font-semibold">Receipts</h1>

      {canCreate && ready && (
        <div className="mb-6">
          <SalesPaymentForm branches={branches} customers={customers} />
        </div>
      )}
      {canCreate && !ready && <p className="mb-6 text-sm text-slate-500">Add a customer first.</p>}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Doc #</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Method</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2">Applied to</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{p.docNumber}</td>
                <td className="px-4 py-2">{p.customer?.name}</td>
                <td className="px-4 py-2 capitalize">{p.method}</td>
                <td className="px-4 py-2 text-right">{p.amount}</td>
                <td className="px-4 py-2">
                  {p.allocations.map((a) => a.invoice?.docNumber).join(", ") || "—"}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No receipts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
