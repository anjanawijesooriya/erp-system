"use client";

import { useState } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Badge, toneForStatus } from "@erp/ui/badge";
import { ReceiptIcon, CreditCardIcon, ClipboardIcon } from "@/components/icons";

interface InvoiceRow {
  id: string;
  docNumber: string;
  invoiceDate: string;
  status: string;
  totalAmount: string;
  itemsSummary: string;
}

interface PaymentRow {
  id: string;
  paymentDate: string;
  method: string;
  amount: string;
  appliedTo: string;
}

interface QuotationRow {
  id: string;
  docNumber: string;
  quoteDate: string;
  status: string;
  itemsSummary: string;
}

type Tab = "invoices" | "payments" | "quotations";

const TABS: { key: Tab; label: string }[] = [
  { key: "invoices", label: "Invoices" },
  { key: "payments", label: "Payments" },
  { key: "quotations", label: "Quotations" },
];

export function CustomerDetailClient({
  invoices,
  payments,
  quotations,
}: {
  invoices: InvoiceRow[];
  payments: PaymentRow[];
  quotations: QuotationRow[];
}) {
  const [tab, setTab] = useState<Tab>("invoices");

  return (
    <>
      <div className="flex gap-7 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-0.5 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.key ? "border-brand-700 text-brand-700" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "invoices" && (
        <Card className="overflow-hidden">
          {invoices.length === 0 ? (
            <EmptyState icon={<ReceiptIcon className="h-5 w-5" />} title="No invoices yet." description="Invoices billed to this customer will show up here." />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Invoice</th>
                  <th className="px-4 py-2.5">Items</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-medium text-brand-700">{inv.docNumber}</td>
                    <td className="px-4 py-2.5 text-slate-600">{inv.itemsSummary}</td>
                    <td className="px-4 py-2.5 text-slate-600">{inv.invoiceDate}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900">{Number(inv.totalAmount).toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={toneForStatus(inv.status)}>{inv.status.replace("_", " ")}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "payments" && (
        <Card className="overflow-hidden">
          {payments.length === 0 ? (
            <EmptyState icon={<CreditCardIcon className="h-5 w-5" />} title="No payments yet." description="Payments received from this customer will show up here." />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Method</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5">Applied to</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 text-slate-600">{p.paymentDate}</td>
                    <td className="px-4 py-2.5 capitalize text-slate-600">{p.method}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900">{Number(p.amount).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-slate-500">{p.appliedTo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "quotations" && (
        <Card className="overflow-hidden">
          {quotations.length === 0 ? (
            <EmptyState icon={<ClipboardIcon className="h-5 w-5" />} title="No quotations yet." description="Quotes sent to this customer will show up here." />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Quotation</th>
                  <th className="px-4 py-2.5">Items</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr key={q.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-medium text-brand-700">{q.docNumber}</td>
                    <td className="px-4 py-2.5 text-slate-600">{q.itemsSummary}</td>
                    <td className="px-4 py-2.5 text-slate-600">{q.quoteDate}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={toneForStatus(q.status)}>{q.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </>
  );
}
