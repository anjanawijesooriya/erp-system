"use client";

import { useActionState, useState } from "react";
import { Button } from "@erp/ui/button";
import { recordChequeAction } from "./actions";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

export function ChequeForm({
  branches,
  customers,
  suppliers,
}: {
  branches: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  suppliers: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(recordChequeAction, undefined);
  const [direction, setDirection] = useState<"received" | "issued">("received");

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
        <label className="mb-1 block text-xs font-medium text-slate-600">Direction</label>
        <select
          name="direction"
          value={direction}
          onChange={(e) => setDirection(e.target.value as "received" | "issued")}
          className={inputClass}
        >
          <option value="received">Received (from customer)</option>
          <option value="issued">Issued (to supplier)</option>
        </select>
      </div>
      {direction === "received" ? (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Customer</label>
          <select name="customerId" required className={inputClass}>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
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
      )}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Cheque number</label>
        <input name="chequeNumber" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Bank name</label>
        <input name="bankName" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Cheque date</label>
        <input name="chequeDate" type="date" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Amount</label>
        <input name="amount" type="number" step="0.01" min="0.01" required className={inputClass} />
      </div>
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-600">Note (optional)</label>
        <input name="note" className={inputClass} />
      </div>
      {state?.error && <p className="col-span-3 text-sm text-red-600">{state.error}</p>}
      <div className="col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Record cheque"}
        </Button>
      </div>
    </form>
  );
}
