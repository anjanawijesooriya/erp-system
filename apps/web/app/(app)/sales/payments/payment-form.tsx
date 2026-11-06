"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { createSalesPaymentAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function SalesPaymentForm({
  branches,
  customers,
}: {
  branches: { id: string; name: string }[];
  customers: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createSalesPaymentAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-white shadow-sm p-4">
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
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Customer</label>
        <select name="customerId" required className={inputClass}>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Payment date</label>
        <input name="paymentDate" type="date" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Method</label>
        <select name="method" required className={inputClass} defaultValue="cash">
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="cheque">Cheque</option>
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Amount</label>
        <input name="amount" type="number" step="0.01" min="0.01" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Note (optional)</label>
        <input name="note" className={inputClass} />
      </div>
      <p className="col-span-3 text-xs text-slate-500">
        Applies against the customer&apos;s oldest outstanding invoices first.
      </p>
      {state?.error && <p className="col-span-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Record receipt"}
        </Button>
      </div>
    </form>
  );
}
