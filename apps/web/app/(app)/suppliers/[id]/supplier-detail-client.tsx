"use client";

import { useState } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Badge, toneForStatus } from "@erp/ui/badge";
import { ClipboardIcon, PackageIcon, CreditCardIcon, UndoIcon } from "@/components/icons";

interface PurchaseOrderRow {
  id: string;
  docNumber: string;
  orderDate: string;
  status: string;
  total: number;
  itemsSummary: string;
}

interface GrnRow {
  id: string;
  docNumber: string;
  receivedDate: string;
  total: number;
  itemsSummary: string;
}

interface PaymentRow {
  id: string;
  docNumber: string;
  paymentDate: string;
  method: string;
  amount: string;
  appliedTo: string;
}

interface ReturnRow {
  id: string;
  docNumber: string;
  returnDate: string;
  reason: string;
  total: number;
  itemsSummary: string;
}

type Tab = "orders" | "grn" | "payments" | "returns";

const TABS: { key: Tab; label: string }[] = [
  { key: "orders", label: "Purchase orders" },
  { key: "grn", label: "Goods received" },
  { key: "payments", label: "Payments" },
  { key: "returns", label: "Returns" },
];

export function SupplierDetailClient({
  orders,
  grns,
  payments,
  returns,
}: {
  orders: PurchaseOrderRow[];
  grns: GrnRow[];
  payments: PaymentRow[];
  returns: ReturnRow[];
}) {
  const [tab, setTab] = useState<Tab>("orders");

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

      {tab === "orders" && (
        <Card className="overflow-hidden">
          {orders.length === 0 ? (
            <EmptyState icon={<ClipboardIcon className="h-5 w-5" />} title="No purchase orders yet." description="Orders placed with this supplier will show up here." />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">PO</th>
                  <th className="px-4 py-2.5">Items</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-medium text-brand-700">{o.docNumber}</td>
                    <td className="px-4 py-2.5 text-slate-600">{o.itemsSummary}</td>
                    <td className="px-4 py-2.5 text-slate-600">{o.orderDate}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900">{o.total.toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={toneForStatus(o.status)}>{o.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "grn" && (
        <Card className="overflow-hidden">
          {grns.length === 0 ? (
            <EmptyState icon={<PackageIcon className="h-5 w-5" />} title="No goods received yet." description="Stock received from this supplier will show up here." />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">GRN</th>
                  <th className="px-4 py-2.5">Items</th>
                  <th className="px-4 py-2.5">Received</th>
                  <th className="px-4 py-2.5 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {grns.map((g) => (
                  <tr key={g.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-medium text-brand-700">{g.docNumber}</td>
                    <td className="px-4 py-2.5 text-slate-600">{g.itemsSummary}</td>
                    <td className="px-4 py-2.5 text-slate-600">{g.receivedDate}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900">{g.total.toLocaleString()}</td>
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
            <EmptyState icon={<CreditCardIcon className="h-5 w-5" />} title="No payments yet." description="Payments made to this supplier will show up here." />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Payment</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Method</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5">Applied to</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-medium text-brand-700">{p.docNumber}</td>
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

      {tab === "returns" && (
        <Card className="overflow-hidden">
          {returns.length === 0 ? (
            <EmptyState icon={<UndoIcon className="h-5 w-5" />} title="No returns yet." description="Stock returned to this supplier will show up here." />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Return</th>
                  <th className="px-4 py-2.5">Items</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5 text-right">Value</th>
                  <th className="px-4 py-2.5">Reason</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-medium text-brand-700">{r.docNumber}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.itemsSummary}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.returnDate}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900">{r.total.toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone="amber">{r.reason.replace(/_/g, " ")}</Badge>
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
