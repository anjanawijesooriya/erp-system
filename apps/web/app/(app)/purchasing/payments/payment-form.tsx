"use client";

import { useActionState, useState } from "react";
import { Button } from "@erp/ui/button";
import { createSupplierPaymentAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

const BUCKET_BADGE: Record<string, string> = {
  current: "bg-accent-100 text-accent-700",
  "1-30": "bg-amber-100 text-amber-700",
  "31-60": "bg-orange-100 text-orange-700",
  "61-90": "bg-rose-100 text-rose-700",
  "90+": "bg-red-200 text-red-800",
};

interface OutstandingInvoice {
  invoiceId: string;
  docNumber: string;
  supplierId: string;
  dueDate: string;
  amountDue: string;
  daysPastDue: number;
  bucket: string;
}

export function SupplierPaymentForm({
  branches,
  suppliers,
  outstanding,
}: {
  branches: { id: string; name: string }[];
  suppliers: { id: string; label: string }[];
  outstanding: OutstandingInvoice[];
}) {
  const [state, formAction, pending] = useActionState(createSupplierPaymentAction, undefined);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");

  const supplierInvoices = outstanding.filter((o) => o.supplierId === supplierId);
  const totalDue = supplierInvoices.reduce((sum, o) => sum + Number(o.amountDue), 0);

  function handleSupplierChange(id: string) {
    setSupplierId(id);
    setInvoiceId("");
    setAmount("");
  }

  function selectInvoice(inv: OutstandingInvoice) {
    setInvoiceId(inv.invoiceId);
    setAmount(inv.amountDue);
  }

  return (
    <form action={formAction} className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Branch</label>
        <select name="branchId" required className={inputClass}>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Supplier</label>
        <select
          name="supplierId"
          required
          value={supplierId}
          onChange={(e) => handleSupplierChange(e.target.value)}
          className={inputClass}
        >
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Payment date</label>
        <input name="paymentDate" type="date" required className={inputClass} />
      </div>

      <div className="col-span-3">
        <div className="flex items-center justify-between">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Outstanding invoices</label>
          {supplierInvoices.length > 0 && (
            <span className="text-xs text-slate-500">Total due: {totalDue.toLocaleString()}</span>
          )}
        </div>
        {supplierInvoices.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">
            No outstanding invoices for this supplier.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Invoice</th>
                  <th className="px-3 py-2">Due date</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Balance</th>
                  <th className="w-20 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {supplierInvoices.map((inv) => (
                  <tr key={inv.invoiceId} className={`border-t border-slate-100 ${invoiceId === inv.invoiceId ? "bg-brand-50/60" : ""}`}>
                    <td className="px-3 py-1.5 font-medium text-slate-900">{inv.docNumber}</td>
                    <td className="px-3 py-1.5 text-slate-600">{inv.dueDate}</td>
                    <td className="px-3 py-1.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${BUCKET_BADGE[inv.bucket] ?? "bg-slate-100 text-slate-600"}`}>
                        {inv.daysPastDue > 0 ? `${inv.daysPastDue}d overdue` : "current"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium text-slate-900">{Number(inv.amountDue).toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => selectInvoice(inv)}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        {invoiceId === inv.invoiceId ? "Selected" : "Pay this"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-1 text-xs text-slate-400">
          Pick an invoice to pre-fill its balance, or leave none selected and the amount is applied to the oldest outstanding invoices first.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Method</label>
        <select name="method" required className={inputClass} defaultValue="bank">
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="cheque">Cheque</option>
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Amount</label>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Note (optional)</label>
        <input name="note" className={inputClass} />
      </div>
      {state?.error && <p className="col-span-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Record payment"}
        </Button>
      </div>
    </form>
  );
}
