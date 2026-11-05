"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { createSupplierPaymentAction } from "./actions";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

export function SupplierPaymentForm({
  branches,
  suppliers,
}: {
  branches: { id: string; name: string }[];
  suppliers: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createSupplierPaymentAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Branch</label>
        <select name="branchId" required className={inputClass}>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Supplier</label>
        <select name="supplierId" required className={inputClass}>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Payment date</label>
        <input name="paymentDate" type="date" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Method</label>
        <select name="method" required className={inputClass} defaultValue="bank">
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="cheque">Cheque</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Amount</label>
        <input name="amount" type="number" step="0.01" min="0.01" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Note (optional)</label>
        <input name="note" className={inputClass} />
      </div>
      <p className="col-span-3 text-xs text-slate-500">
        Applies against the supplier&apos;s oldest outstanding invoices first.
      </p>
      {state?.error && <p className="col-span-3 text-sm text-red-600">{state.error}</p>}
      <div className="col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Record payment"}
        </Button>
      </div>
    </form>
  );
}
