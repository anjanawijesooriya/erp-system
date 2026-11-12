"use client";

import { useState } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Button } from "@erp/ui/button";
import { Sheet, DetailRow, DetailSection } from "@erp/ui/sheet";
import { CreditCardIcon } from "@/components/icons";
import { SalesPaymentForm } from "./payment-form";

interface Payment {
  id: string;
  docNumber: string;
  paymentDate: string;
  method: string;
  amount: string;
  note: string | null;
  customer: { name: string } | null;
  allocations: { amountApplied: string; invoice: { docNumber: string } | null }[];
}

export function ReceiptsClient({
  payments,
  branches,
  customers,
  canCreate,
}: {
  payments: Payment[];
  branches: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  canCreate: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Payment | null>(null);

  return (
    <>
      {canCreate && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <CreditCardIcon className="h-4 w-4" />
            New receipt
          </Button>
        </div>
      )}

      {payments.length === 0 ? (
        <Card>
          <EmptyState icon={<CreditCardIcon className="h-5 w-5" />} title="No receipts yet." description="Record one against an outstanding invoice." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Doc #</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Method</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5">Applied to</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-900">{p.docNumber}</td>
                  <td className="px-4 py-2.5 text-slate-600">{p.customer?.name}</td>
                  <td className="px-4 py-2.5 capitalize text-slate-600">{p.method}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{p.amount}</td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {p.allocations.map((a) => a.invoice?.docNumber).join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New receipt"
        description="Record money received from a customer."
        icon={<CreditCardIcon className="h-4 w-4" />}
      >
        <SalesPaymentForm branches={branches} customers={customers} />
      </Sheet>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.docNumber ?? ""}
        description="Receipt details"
        icon={<CreditCardIcon className="h-4 w-4" />}
        width="md"
      >
        {selected && (
          <>
            <DetailSection title="Overview">
              <DetailRow label="Customer" value={selected.customer?.name ?? "—"} />
              <DetailRow label="Payment date" value={selected.paymentDate} />
              <DetailRow label="Method" value={<span className="capitalize">{selected.method}</span>} />
              <DetailRow label="Amount" value={selected.amount} />
              {selected.note && <DetailRow label="Note" value={selected.note} />}
            </DetailSection>
            <DetailSection title="Applied to">
              {selected.allocations.length === 0 ? (
                <p className="text-sm text-slate-400">Not applied to any invoice.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Invoice</th>
                        <th className="px-3 py-2 text-right">Amount applied</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.allocations.map((a, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-3 py-1.5">{a.invoice?.docNumber ?? "—"}</td>
                          <td className="px-3 py-1.5 text-right">{a.amountApplied}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DetailSection>
          </>
        )}
      </Sheet>
    </>
  );
}
