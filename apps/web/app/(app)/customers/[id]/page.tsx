import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { db } from "@erp/db";
import { customers } from "@erp/db/schema";
import { listSalesInvoices, listSalesPayments, listQuotations } from "@erp/core/sales";
import { listProducts } from "@erp/core/catalog";
import { requireSession } from "@/lib/session";
import { Badge } from "@erp/ui/badge";
import { ReceiptIcon } from "@/components/icons";
import { CustomerDetailClient } from "./customer-detail-client";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await requireSession();

  const [customer, allInvoices, allPayments, allQuotations, products] = await Promise.all([
    db.query.customers.findFirst({ where: and(eq(customers.id, id), eq(customers.tenantId, tenantId)) }),
    listSalesInvoices(tenantId),
    listSalesPayments(tenantId),
    listQuotations(tenantId),
    listProducts(tenantId),
  ]);
  if (!customer) notFound();

  const productNameByVariantId = new Map<string, string>();
  for (const p of products) {
    for (const v of p.variants) productNameByVariantId.set(v.id, p.name);
  }
  const itemsSummary = (lines: { productVariantId: string; qty: string }[]) =>
    lines.map((l) => `${productNameByVariantId.get(l.productVariantId) ?? "Item"} ×${l.qty}`).join(", ");

  const invoices = allInvoices
    .filter((inv) => inv.customerId === customer.id)
    .map((inv) => ({
      id: inv.id,
      docNumber: inv.docNumber,
      invoiceDate: inv.invoiceDate,
      status: inv.status,
      totalAmount: inv.totalAmount,
      itemsSummary: itemsSummary(inv.lines),
    }));

  const payments = allPayments
    .filter((p) => p.customerId === customer.id)
    .map((p) => ({
      id: p.id,
      paymentDate: p.paymentDate,
      method: p.method,
      amount: p.amount,
      appliedTo: p.allocations.map((a) => a.invoice?.docNumber).filter(Boolean).join(", ") || "—",
    }));

  const quotations = allQuotations
    .filter((q) => q.customerId === customer.id)
    .map((q) => ({
      id: q.id,
      docNumber: q.docNumber,
      quoteDate: q.quoteDate,
      status: q.status,
      itemsSummary: itemsSummary(q.lines),
    }));

  const lifetimeSales = invoices
    .filter((inv) => inv.status !== "cancelled")
    .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const outstanding = allInvoices
    .filter((inv) => inv.customerId === customer.id && inv.status !== "paid" && inv.status !== "cancelled")
    .reduce((sum, inv) => {
      const applied = inv.allocations.reduce((s, a) => s + Number(a.amountApplied), 0);
      return sum + (Number(inv.totalAmount) - applied);
    }, 0);

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/customers" className="font-medium text-brand-700 hover:text-brand-800">
          Customers
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-900">{customer.name}</span>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl font-bold text-brand-700">
          {initialsOf(customer.name)}
        </span>
        <div className="flex min-w-[220px] flex-1 flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
            <Badge tone={customer.isActive ? "accent" : "slate"}>{customer.isActive ? "Active" : "Inactive"}</Badge>
          </div>
          <span className="text-sm text-slate-500">
            {[customer.phone, customer.email].filter(Boolean).join(" · ") || "No contact details"}
          </span>
          {customer.address && <span className="text-sm text-slate-500">{customer.address}</span>}
        </div>
        <div className="flex gap-7">
          <div className="text-right">
            <div className="text-xs text-slate-400">Lifetime sales</div>
            <div className="text-lg font-bold text-slate-900">{lifetimeSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Outstanding</div>
            <div className={`text-lg font-bold ${outstanding > 0.0001 ? "text-danger-600" : "text-success-700"}`}>
              {outstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
        <Link
          href="/sales/invoices"
          className="flex h-10 flex-shrink-0 items-center gap-1.5 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
        >
          <ReceiptIcon className="h-4 w-4" />
          New invoice
        </Link>
      </div>

      <CustomerDetailClient invoices={invoices} payments={payments} quotations={quotations} />
    </main>
  );
}
