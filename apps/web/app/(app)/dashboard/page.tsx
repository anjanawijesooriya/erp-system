import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { customers, suppliers, tenants } from "@erp/db/schema";
import { requireSession } from "@/lib/session";
import { getMonthlyRevenueExpense } from "@erp/core/accounting";
import { getSalesByDay, getTopProducts } from "@erp/core/reports";
import { RevenueExpenseChart, SalesTrendChart, TopProductsChart } from "@/components/charts";

const QUICK_LINKS = [
  { href: "/pos", label: "Point of sale", color: "bg-brand-50 text-brand-700", body: "Ring up a sale" },
  { href: "/sales/invoices", label: "Sales invoices", color: "bg-accent-50 text-accent-700", body: "Review recent invoices" },
  { href: "/purchasing/orders", label: "Purchase orders", color: "bg-orange-50 text-orange-700", body: "Order from a supplier" },
  { href: "/accounting/reports", label: "Financial reports", color: "bg-violet-50 text-violet-700", body: "Trial balance, P&L, balance sheet" },
  { href: "/inventory", label: "Stock on hand", color: "bg-cyan-50 text-cyan-700", body: "Check inventory by warehouse" },
  { href: "/hr/payroll", label: "Payroll", color: "bg-rose-50 text-rose-700", body: "Run this month's payroll" },
];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const { tenantId } = await requireSession();
  const today = daysAgo(0);
  const fortnightAgo = daysAgo(13);
  const monthAgo = daysAgo(29);

  const [tenant, customerCount, supplierCount, salesByDay, monthlyFinancials, topProducts] = await Promise.all([
    db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) }),
    db.select().from(customers).where(eq(customers.tenantId, tenantId)).then((r) => r.length),
    db.select().from(suppliers).where(eq(suppliers.tenantId, tenantId)).then((r) => r.length),
    getSalesByDay(tenantId, { from: fortnightAgo, to: today }),
    getMonthlyRevenueExpense(tenantId, 6),
    getTopProducts(tenantId, { from: monthAgo, to: today }, 6),
  ]);

  const todaysSales = salesByDay.find((d) => d.day === today);
  const latestMonth = monthlyFinancials[monthlyFinancials.length - 1];
  const netProfit = (latestMonth?.revenue ?? 0) - (latestMonth?.expenses ?? 0);

  const salesChartData = salesByDay.map((d) => ({ day: d.day, totalSales: Number(d.totalSales) }));
  const topProductsChartData = topProducts.map((p) => ({ productName: p.productName, totalRevenue: Number(p.totalRevenue) }));

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Welcome back{tenant ? `, ${tenant.name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-slate-500">Here's how things are looking today.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Today&apos;s sales</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{Number(todaysSales?.totalSales ?? 0).toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-400">{todaysSales?.invoiceCount ?? 0} invoices</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Customers</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{customerCount}</p>
          <p className="mt-1 text-xs text-slate-400">Active accounts</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Suppliers</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{supplierCount}</p>
          <p className="mt-1 text-xs text-slate-400">Active vendors</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">This month&apos;s net profit</p>
          <p className={`mt-2 text-2xl font-semibold ${netProfit >= 0 ? "text-accent-600" : "text-rose-600"}`}>
            {netProfit.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">Revenue minus expenses</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Sales — last 14 days</h2>
          <p className="text-xs text-slate-400">Billed amount per day</p>
          <div className="mt-2">
            <SalesTrendChart data={salesChartData} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Revenue vs expenses — last 6 months</h2>
          <p className="text-xs text-slate-400">From the general ledger</p>
          <div className="mt-2">
            <RevenueExpenseChart data={monthlyFinancials} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Top products — last 30 days</h2>
          <p className="text-xs text-slate-400">By revenue</p>
          <div className="mt-2">
            {topProductsChartData.length > 0 ? (
              <TopProductsChart data={topProductsChartData} />
            ) : (
              <p className="py-12 text-center text-sm text-slate-400">No sales in the last 30 days yet.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {QUICK_LINKS.map((q) => (
            <a
              key={q.href}
              href={q.href}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${q.color}`}>{q.label}</span>
              <p className="mt-3 text-sm text-slate-500">{q.body}</p>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
