"use client";

import { useState } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Button } from "@erp/ui/button";
import { Sheet, DetailRow, DetailSection } from "@erp/ui/sheet";
import { CreditCardIcon } from "@/components/icons";
import { SupplierPaymentForm } from "./payment-form";

interface OutstandingInvoice {
  invoiceId: string;
  docNumber: string;
  supplierId: string;
  dueDate: string;
  amountDue: string;
  daysPastDue: number;
  bucket: string;
}

interface Payment {
  id: string;
  docNumber: string;
  paymentDate: string;
  method: string;
  amount: string;
  note: string | null;
  supplier: { name: string } | null;
  allocations: { amountApplied: string; invoice: { docNumber: string } | null }[];
}

export function SupplierPaymentsClient({
  payments,
  branches,
  suppliers,
  outstanding,
  canCreate,
}: {
  payments: Payment[];
  branches: { id: string; name: string }[];
  suppliers: { id: string; label: string }[];
  outstanding: OutstandingInvoice[];
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
            New payment
          </Button>
        </div>
      )}

      {payments.length === 0 ? (
        <Card>
          <EmptyState icon={<CreditCardIcon className="h-5 w-5" />} title="No payments yet." description="Record one against an outstanding invoice." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Doc #</th>
                <th className="px-4 py-2.5">Supplier</th>
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
                  <td className="px-4 py-2.5 text-slate-600">{p.supplier?.name}</td>
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
        title="New supplier payment"
        description="Pay down an outstanding invoice."
        icon={<CreditCardIcon className="h-4 w-4" />}
      >
        <SupplierPaymentForm branches={branches} suppliers={suppliers} outstanding={outstanding} />
      </Sheet>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.docNumber ?? ""}
        description="Payment details"
        icon={<CreditCardIcon className="h-4 w-4" />}
        width="md"
      >
        {selected && (
          <>
            <DetailSection title="Overview">
              <DetailRow label="Supplier" value={selected.supplier?.name ?? "—"} />
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
