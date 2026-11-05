import { listSalesReturns } from "@erp/core/sales";
import { listWarehouses } from "@erp/core/inventory";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { getBranchOptions } from "@/lib/branch-options";
import { getCustomerOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { SalesReturnForm } from "./return-form";

export default async function SalesReturnsPage() {
  const { tenantId, userId } = await requireSession();
  const [returns, branches, warehouses, customers, variants, canCreate] = await Promise.all([
    listSalesReturns(tenantId),
    getBranchOptions(tenantId),
    listWarehouses(tenantId),
    getCustomerOptions(tenantId),
    getVariantOptions(tenantId),
    can(userId, PERMISSIONS.SALES_RETURN_CREATE),
  ]);

  const ready = branches.length > 0 && warehouses.length > 0 && customers.length > 0 && variants.length > 0;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Sales returns</h1>

      {canCreate && ready && (
        <div className="mb-6">
          <SalesReturnForm branches={branches} warehouses={warehouses} customers={customers} variants={variants} />
        </div>
      )}
      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">
          Add a warehouse, a customer and a product before posting a return.
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Doc #</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Warehouse</th>
              <th className="px-4 py-2">Reason</th>
              <th className="px-4 py-2 text-right">Lines</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{r.docNumber}</td>
                <td className="px-4 py-2">{r.customer?.name}</td>
                <td className="px-4 py-2">{r.warehouse?.name}</td>
                <td className="px-4 py-2 capitalize">{r.reason.replace(/_/g, " ")}</td>
                <td className="px-4 py-2 text-right">{r.lines.length}</td>
              </tr>
            ))}
            {returns.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No sales returns yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
