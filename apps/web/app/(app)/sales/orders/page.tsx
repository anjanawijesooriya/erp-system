import { listSalesOrders } from "@erp/core/sales";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { SalesDocForm } from "@/components/sales-doc-form";
import { getBranchOptions } from "@/lib/branch-options";
import { getCustomerOptions } from "@/lib/party-options";
import { getVariantOptions } from "@/lib/product-options";
import { createSalesOrderAction } from "./actions";

export default async function SalesOrdersPage() {
  const { tenantId, userId } = await requireSession();
  const [orders, branches, customers, variants, canCreate] = await Promise.all([
    listSalesOrders(tenantId),
    getBranchOptions(tenantId),
    getCustomerOptions(tenantId),
    getVariantOptions(tenantId),
    can(userId, PERMISSIONS.SALES_ORDER_CREATE),
  ]);

  const ready = branches.length > 0 && customers.length > 0 && variants.length > 0;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Sales orders</h1>

      {canCreate && ready && (
        <div className="mb-6">
          <SalesDocForm
            action={createSalesOrderAction}
            branches={branches}
            customers={customers}
            variants={variants}
            dateFieldName="orderDate"
            dateLabel="Order date"
            submitLabel="Create sales order"
          />
        </div>
      )}
      {canCreate && !ready && (
        <p className="mb-6 text-sm text-slate-500">Add a customer and a product before ordering.</p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Doc #</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Order date</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Lines</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{o.docNumber}</td>
                <td className="px-4 py-2">{o.customer?.name}</td>
                <td className="px-4 py-2">{o.orderDate}</td>
                <td className="px-4 py-2 capitalize">{o.status}</td>
                <td className="px-4 py-2 text-right">{o.lines.length}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No sales orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
