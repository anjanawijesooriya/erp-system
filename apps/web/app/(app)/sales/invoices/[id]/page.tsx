import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { tenants } from "@erp/db/schema";
import { getSalesInvoice } from "@erp/core/sales";
import { getDocumentBranding } from "@erp/core/tenants";
import { requireSession } from "@/lib/session";
import { PrintButton } from "./print-button";

const STATUS_BADGE: Record<string, string> = {
  paid: "bg-accent-100 text-accent-700",
  unpaid: "bg-amber-100 text-amber-700",
  partially_paid: "bg-sky-100 text-sky-700",
  void: "bg-slate-200 text-slate-500",
};

export default async function SalesInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await requireSession();

  const [invoice, branding, tenant] = await Promise.all([
    getSalesInvoice(tenantId, id),
    getDocumentBranding(tenantId),
    db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) }),
  ]);
  if (!invoice) notFound();

  const color = branding.primaryColor;

  return (
    <main className="mx-auto max-w-3xl p-8 print:max-w-none print:p-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/sales/invoices" className="text-xs font-medium text-brand-600 hover:text-brand-700">
          ← Sales invoices
        </Link>
        <PrintButton />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <div className="flex items-start justify-between p-8" style={{ borderBottom: `3px solid ${color}` }}>
          <div>
            <p className="text-lg font-semibold text-slate-900">{tenant?.name}</p>
            {branding.companyAddress && <p className="mt-0.5 text-sm text-slate-500">{branding.companyAddress}</p>}
            {(branding.companyPhone || branding.companyEmail) && (
              <p className="text-sm text-slate-500">
                {branding.companyPhone}
                {branding.companyPhone && branding.companyEmail ? " · " : ""}
                {branding.companyEmail}
              </p>
            )}
          </div>
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoUrl} alt="Logo" className="h-12 max-w-[160px] object-contain" />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg text-base font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {(tenant?.name ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex items-start justify-between p-8 pb-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill to</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{invoice.customer?.name}</p>
            {invoice.customer?.address && <p className="text-sm text-slate-500">{invoice.customer.address}</p>}
            {invoice.customer?.phone && <p className="text-sm text-slate-500">{invoice.customer.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold uppercase tracking-wide" style={{ color }}>
              Invoice
            </p>
            <p className="mt-1 text-sm text-slate-500">{invoice.docNumber}</p>
            <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[invoice.status] ?? "bg-slate-100 text-slate-600"}`}>
              {invoice.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-8 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Invoice date</p>
            <p className="mt-1 text-slate-900">{invoice.invoiceDate}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Due date</p>
            <p className="mt-1 text-slate-900">{invoice.dueDate}</p>
          </div>
        </div>

        <div className="px-8">
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: `${color}1a` }}>
                <th className="rounded-l-lg px-3 py-2 font-medium" style={{ color }}>Item</th>
                <th className="px-3 py-2 text-right font-medium" style={{ color }}>Qty</th>
                <th className="px-3 py-2 text-right font-medium" style={{ color }}>Rate</th>
                <th className="rounded-r-lg px-3 py-2 text-right font-medium" style={{ color }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((l) => (
                <tr key={l.id} className="border-b border-slate-100">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-slate-900">{l.productVariant?.name}</p>
                    <p className="text-xs text-slate-400">{l.productVariant?.sku}</p>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{Number(l.qty).toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{Number(l.unitPrice).toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-slate-900">{Number(l.lineTotal).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end p-8 pt-4">
          <div className="w-56">
            <div className="flex items-baseline justify-between border-t-2 pt-2 text-base font-semibold" style={{ borderColor: color }}>
              <span className="text-slate-900">Total</span>
              <span style={{ color }}>{Number(invoice.totalAmount).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {branding.footerNote && (
          <div className="border-t border-slate-100 px-8 py-4 text-sm text-slate-500">{branding.footerNote}</div>
        )}
      </div>
    </main>
  );
}
