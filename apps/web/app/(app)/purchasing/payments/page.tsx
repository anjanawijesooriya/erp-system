import { listSupplierPayments } from "@erp/core/purchasing";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { getBranchOptions } from "@/lib/branch-options";
import { getSupplierOptions } from "@/lib/party-options";
import { SupplierPaymentForm } from "./payment-form";

export default async function SupplierPaymentsPage() {
  const { tenantId, userId } = await requireSession();
  const [payments, branches, suppliers, canCreate] = await Promise.all([
    listSupplierPayments(tenantId),
    getBranchOptions(tenantId),
    getSupplierOptions(tenantId),
    can(userId, PERMISSIONS.SUPPLIER_PAYMENT_CREATE),
  ]);

  const ready = branches.length > 0 && suppliers.length > 0;

  return (
    <ModuleGate tenantId={tenantId} moduleKey="purchasing">
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Supplier payments</h1>

      {canCreate && ready && (
        <div className="mb-6">
          <SupplierPaymentForm branches={branches} suppliers={suppliers} />
        </div>
      )}
      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">Add a supplier before recording a payment.</p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Doc #</th>
              <th className="px-4 py-2">Supplier</th>
              <th className="px-4 py-2">Method</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2">Applied to</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{p.docNumber}</td>
                <td className="px-4 py-2">{p.supplier?.name}</td>
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
                  No payments yet.
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
