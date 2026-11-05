"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { createSalesReturnAction } from "./actions";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

export function SalesReturnForm({
  branches,
  warehouses,
  customers,
  variants,
}: {
  branches: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createSalesReturnAction, undefined);

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
        <label className="mb-1 block text-xs font-medium text-slate-600">Warehouse</label>
        <select name="warehouseId" required className={inputClass}>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
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
      <div className="col-span-3">
        <label className="mb-1 block text-xs font-medium text-slate-600">Product</label>
        <select name="productVariantId" required className={inputClass}>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Quantity</label>
        <input name="quantity" type="number" step="0.01" min="0.0001" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Credit value / unit</label>
        <input name="unitPrice" type="number" step="0.01" min="0" defaultValue="0" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Return date</label>
        <input name="returnDate" type="date" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Reason</label>
        <select name="reason" required className={inputClass} defaultValue="customer_changed_mind">
          <option value="damaged">Damaged</option>
          <option value="wrong_item">Wrong item</option>
          <option value="customer_changed_mind">Customer changed mind</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="col-span-3">
        <label className="mb-1 block text-xs font-medium text-slate-600">Note (optional)</label>
        <input name="note" className={inputClass} />
      </div>
      {state?.error && <p className="col-span-3 text-sm text-red-600">{state.error}</p>}
      <div className="col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Post return"}
        </Button>
      </div>
    </form>
  );
}
