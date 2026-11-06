import {
  getDeadStock,
  getMarginByProduct,
  getSalesByDay,
  getStockValuation,
  getTopCustomers,
  getTopProducts,
} from "@erp/core/reports";
import { requireSession } from "@/lib/session";

function today() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; deadStockDays?: string }>;
}) {
  const { tenantId } = await requireSession();
  const { from = daysAgo(30), to = today(), deadStockDays = "90" } = await searchParams;
  const range = { from, to };

  const [salesByDay, topProducts, topCustomers, margin, valuation, deadStock] = await Promise.all([
    getSalesByDay(tenantId, range),
    getTopProducts(tenantId, range),
    getTopCustomers(tenantId, range),
    getMarginByProduct(tenantId, range),
    getStockValuation(tenantId),
    getDeadStock(tenantId, Number(deadStockDays)),
  ]);

  const totalSales = salesByDay.reduce((sum, r) => sum + Number(r.totalSales), 0);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Reports</h1>

      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white shadow-sm p-4 text-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">From</label>
          <input name="from" type="date" defaultValue={from} className="rounded-md border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">To</label>
          <input name="to" type="date" defaultValue={to} className="rounded-md border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Dead stock: days since last sale</label>
          <input
            name="deadStockDays"
            type="number"
            min="1"
            defaultValue={deadStockDays}
            className="w-28 rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded-md border border-slate-300 px-3 py-2">
          Update
        </button>
      </form>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">
          Sales by day ({from} – {to}) · Total: {totalSales.toFixed(2)}
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Invoices</th>
                <th className="px-4 py-2.5 text-right">Sales</th>
              </tr>
            </thead>
            <tbody>
              {salesByDay.map((r) => (
                <tr key={r.day} className="border-t border-slate-100">
                  <td className="px-4 py-2.5">{r.day}</td>
                  <td className="px-4 py-2.5 text-right">{r.invoiceCount}</td>
                  <td className="px-4 py-2.5 text-right">{r.totalSales}</td>
                </tr>
              ))}
              {salesByDay.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                    No sales in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-2 gap-6">
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Top products</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((r) => (
                  <tr key={r.productVariantId} className="border-t border-slate-100">
                    <td className="px-3 py-2">{r.productName}</td>
                    <td className="px-3 py-2 text-right">{r.qtySold}</td>
                    <td className="px-3 py-2 text-right">{r.totalRevenue}</td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-slate-400">
                      No data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Top customers</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2 text-right">Invoices</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((r) => (
                  <tr key={r.customerId} className="border-t border-slate-100">
                    <td className="px-3 py-2">{r.customerName}</td>
                    <td className="px-3 py-2 text-right">{r.invoiceCount}</td>
                    <td className="px-3 py-2 text-right">{r.totalRevenue}</td>
                  </tr>
                ))}
                {topCustomers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-slate-400">
                      No data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Margin by product</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Product</th>
                <th className="px-4 py-2.5 text-right">Revenue</th>
                <th className="px-4 py-2.5 text-right">COGS</th>
                <th className="px-4 py-2.5 text-right">Margin</th>
                <th className="px-4 py-2.5 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {margin.map((r) => (
                <tr key={r.productVariantId} className="border-t border-slate-100">
                  <td className="px-4 py-2.5">{r.productName}</td>
                  <td className="px-4 py-2.5 text-right">{r.revenue}</td>
                  <td className="px-4 py-2.5 text-right">{r.cogs}</td>
                  <td className="px-4 py-2.5 text-right">{r.margin}</td>
                  <td className="px-4 py-2.5 text-right">{r.marginPct}%</td>
                </tr>
              ))}
              {margin.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">
          Stock valuation · Total: {valuation.totalValue}
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Warehouse</th>
                <th className="px-4 py-2.5">Product</th>
                <th className="px-4 py-2.5 text-right">Qty</th>
                <th className="px-4 py-2.5 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {valuation.rows.map((r) => (
                <tr key={`${r.warehouseId}-${r.productVariantId}`} className="border-t border-slate-100">
                  <td className="px-4 py-2.5">{r.warehouseName}</td>
                  <td className="px-4 py-2.5">{r.productName}</td>
                  <td className="px-4 py-2.5 text-right">{r.quantity}</td>
                  <td className="px-4 py-2.5 text-right">{Number(r.value).toFixed(2)}</td>
                </tr>
              ))}
              {valuation.rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No stock on hand.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">
          Dead stock (no sale in {deadStockDays} days)
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Warehouse</th>
                <th className="px-4 py-2.5">Product</th>
                <th className="px-4 py-2.5 text-right">Qty</th>
                <th className="px-4 py-2.5 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {deadStock.map((r) => (
                <tr key={`${r.warehouseId}-${r.productVariantId}`} className="border-t border-slate-100">
                  <td className="px-4 py-2.5">{r.warehouseName}</td>
                  <td className="px-4 py-2.5">{r.productName}</td>
                  <td className="px-4 py-2.5 text-right">{r.quantity}</td>
                  <td className="px-4 py-2.5 text-right">{Number(r.value).toFixed(2)}</td>
                </tr>
              ))}
              {deadStock.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No dead stock.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
