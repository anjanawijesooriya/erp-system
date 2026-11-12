import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { customers, suppliers, tenants } from "@erp/db/schema";
import { requireSession } from "@/lib/session";
import { getStockValuation, getSalesByDay } from "@erp/core/reports";
import { getMonthlyRevenueExpense } from "@erp/core/accounting";
import { listReceivablesAging, listSalesInvoices } from "@erp/core/sales";
import { Card } from "@erp/ui/card";
import { Badge, toneForStatus } from "@erp/ui/badge";
import { RevenueExpenseChart, SalesTrendChart } from "@/components/charts";
import { ReceiptIcon, UsersIcon, CreditCardIcon, TruckIcon, PackageIcon, WalletIcon } from "@/components/icons";

const QUICK_LINKS = [
  { href: "/sales/invoices", label: "New invoice", icon: ReceiptIcon, iconBg: "bg-brand-50", iconText: "text-brand-700" },
  { href: "/customers", label: "Add customer", icon: UsersIcon, iconBg: "bg-success-50", iconText: "text-success-700" },
  { href: "/sales/payments", label: "Record payment", icon: CreditCardIcon, iconBg: "bg-warning-50", iconText: "text-warning-700" },
  { href: "/purchasing/grn", label: "Add GRN", icon: TruckIcon, iconBg: "bg-danger-50", iconText: "text-danger-700" },
  { href: "/accounting/reports", label: "View reports", icon: PackageIcon, iconBg: "bg-info-50", iconText: "text-info-700" },
];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function TrendChip({ value, flip = false }: { value: number | null; flip?: boolean }) {
  if (value === null) return null;
  const good = flip ? value <= 0 : value >= 0;
  return (
    <Badge tone={good ? "accent" : "rose"} className="rounded-md px-2 py-0.5">
      {value >= 0 ? "+" : ""}
      {value.toFixed(0)}%
    </Badge>
  );
}

export default async function DashboardPage() {
  const { tenantId } = await requireSession();
  const today = daysAgo(0);
  const yesterday = daysAgo(1);
  const fortnightAgo = daysAgo(13);
  const monthAgo = daysAgo(29);

  const [
    tenant,
    customerCount,
    newCustomerCount,
    supplierCount,
    salesByDay,
    monthlyFinancials,
    stockValuation,
    receivables,
    recentInvoices,
  ] = await Promise.all([
    db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) }),
    db.select().from(customers).where(eq(customers.tenantId, tenantId)).then((r) => r.length),
    db
      .select()
      .from(customers)
      .where(eq(customers.tenantId, tenantId))
      .then((rows) => rows.filter((c) => new Date(c.createdAt) >= new Date(monthAgo)).length),
    db.select().from(suppliers).where(eq(suppliers.tenantId, tenantId)).then((r) => r.length),
    getSalesByDay(tenantId, { from: fortnightAgo, to: today }),
    getMonthlyRevenueExpense(tenantId, 6),
    getStockValuation(tenantId),
    listReceivablesAging(tenantId),
    listSalesInvoices(tenantId),
  ]);

  const todaysSales = salesByDay.find((d) => d.day === today);
  const yesterdaysSales = salesByDay.find((d) => d.day === yesterday);
  const salesTrend = pctChange(Number(todaysSales?.totalSales ?? 0), Number(yesterdaysSales?.totalSales ?? 0));

  const receivablesTotal = receivables.reduce((sum, r) => sum + Number(r.amountDue), 0);
  const stockSkuCount = new Set(stockValuation.rows.map((r) => r.productVariantId)).size;

  const salesChartData = salesByDay.map((d) => ({ day: d.day, totalSales: Number(d.totalSales) }));

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[23px] font-semibold tracking-tight text-slate-900">
            {greeting}{tenant ? `, ${tenant.name}` : ""}
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500">Here&apos;s what&apos;s happening today, {dateLabel}.</p>
        </div>
        <Badge tone="accent" className="gap-1.5 rounded-full px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success-600" />
          Live
        </Badge>
      </div>

      <section className="mb-6">
        <span className="mb-3 block text-xs font-bold uppercase tracking-wide text-slate-400">Quick actions</span>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
          {QUICK_LINKS.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-[18px] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${q.iconBg} ${q.iconText}`}>
                <q.icon className="h-[19px] w-[19px]" />
              </span>
              <span className="text-[13.5px] font-semibold text-slate-900">{q.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col gap-2.5 p-[18px]">
          <div className="flex items-start justify-between">
            <span className="text-[12.5px] font-medium text-slate-500">Today&apos;s sales</span>
            <TrendChip value={salesTrend} />
          </div>
          <span className="text-[26px] font-semibold tracking-tight text-slate-900">{todaysSales?.invoiceCount ?? 0}</span>
          <span className="text-[12.5px] text-slate-400">{Number(todaysSales?.totalSales ?? 0).toLocaleString()} billed</span>
        </Card>
        <Card className="flex flex-col gap-2.5 p-[18px]">
          <div className="flex items-start justify-between">
            <span className="text-[12.5px] font-medium text-slate-500">Total customers</span>
            {newCustomerCount > 0 && <Badge tone="amber" className="rounded-md px-2 py-0.5">+{newCustomerCount}</Badge>}
          </div>
          <span className="text-[26px] font-semibold tracking-tight text-slate-900">{customerCount}</span>
          <span className="text-[12.5px] text-slate-400">Active accounts</span>
        </Card>
        <Card className="flex flex-col gap-2.5 p-[18px]">
          <div className="flex items-start justify-between">
            <span className="text-[12.5px] font-medium text-slate-500">Outstanding receivables</span>
            {receivables.length > 0 && <Badge tone="rose" className="rounded-md px-2 py-0.5">{receivables.length} due</Badge>}
          </div>
          <span className="text-[26px] font-semibold tracking-tight text-slate-900">{receivablesTotal.toLocaleString()}</span>
          <span className="text-[12.5px] text-slate-400">Across {new Set(receivables.map((r) => r.customerName)).size} customers</span>
        </Card>
        <Card className="flex flex-col gap-2.5 p-[18px]">
          <div className="flex items-start justify-between">
            <span className="text-[12.5px] font-medium text-slate-500">Stock value on hand</span>
            <Badge tone="sky" className="rounded-md px-2 py-0.5">{stockSkuCount} SKUs</Badge>
          </div>
          <span className="text-[26px] font-semibold tracking-tight text-slate-900">{Number(stockValuation.totalValue).toLocaleString()}</span>
          <span className="text-[12.5px] text-slate-400">At cost, all warehouses</span>
        </Card>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Card className="flex flex-col gap-4 p-5">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">Sales overview</h3>
            <span className="text-xs text-slate-400">Last 14 days, billed amount</span>
          </div>
          <SalesTrendChart data={salesChartData} />
        </Card>
        <Card className="flex flex-col gap-4 p-5">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">Revenue vs expenses</h3>
            <span className="text-xs text-slate-400">Last 6 months, from the general ledger</span>
          </div>
          <RevenueExpenseChart data={monthlyFinancials} />
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-[15px] font-semibold text-slate-900">Recent invoices</h3>
          <Link href="/sales/invoices" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            View all →
          </Link>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-2.5">Invoice</th>
              <th className="px-5 py-2.5">Customer</th>
              <th className="px-5 py-2.5">Date</th>
              <th className="px-5 py-2.5 text-right">Amount</th>
              <th className="px-5 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentInvoices.slice(0, 6).map((inv) => (
              <tr key={inv.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                <td className="px-5 py-2.5 font-semibold text-brand-700">{inv.docNumber}</td>
                <td className="px-5 py-2.5 text-slate-700">{inv.customer?.name}</td>
                <td className="px-5 py-2.5 text-slate-500">{inv.invoiceDate}</td>
                <td className="px-5 py-2.5 text-right font-medium text-slate-900">{Number(inv.totalAmount).toLocaleString()}</td>
                <td className="px-5 py-2.5">
                  <Badge tone={toneForStatus(inv.status)}>{inv.status.replace("_", " ")}</Badge>
                </td>
              </tr>
            ))}
            {recentInvoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                  No invoices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </main>
  );
}
