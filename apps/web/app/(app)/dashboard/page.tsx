import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { tenants } from "@erp/db/schema";
import { requireSession } from "@/lib/session";

const QUICK_LINKS = [
  { href: "/pos", label: "Point of sale", color: "bg-brand-50 text-brand-700", body: "Ring up a sale" },
  { href: "/sales/invoices", label: "Sales invoices", color: "bg-accent-50 text-accent-700", body: "Review recent invoices" },
  { href: "/purchasing/orders", label: "Purchase orders", color: "bg-orange-50 text-orange-700", body: "Order from a supplier" },
  { href: "/accounting/reports", label: "Financial reports", color: "bg-violet-50 text-violet-700", body: "Trial balance, P&L, balance sheet" },
  { href: "/inventory", label: "Stock on hand", color: "bg-cyan-50 text-cyan-700", body: "Check inventory by warehouse" },
  { href: "/hr/payroll", label: "Payroll", color: "bg-rose-50 text-rose-700", body: "Run this month's payroll" },
];

export default async function DashboardPage() {
  const { tenantId } = await requireSession();
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Welcome back{tenant ? `, ${tenant.name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-slate-500">Here's a quick way into the parts of the system you use most.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Every phase of the build plan is live: master data, inventory, purchasing, sales, accounting,
        reporting, pilot support, HR &amp; payroll, manufacturing, e-commerce sync, and the accountant
        portal. Use the sidebar to get to any module.
      </div>
    </main>
  );
}
