"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { createPurchaseReturnAction } from "./actions";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

export function PurchaseReturnForm({
  branches,
  warehouses,
  suppliers,
  variants,
}: {
  branches: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  suppliers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createPurchaseReturnAction, undefined);

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
        <label className="mb-1 block text-xs font-medium text-slate-600">Supplier</label>
        <select name="supplierId" required className={inputClass}>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
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
        <label className="mb-1 block text-xs font-medium text-slate-600">Return date</label>
        <input name="returnDate" type="date" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Reason</label>
        <select name="reason" required className={inputClass} defaultValue="damaged">
          <option value="damaged">Damaged</option>
          <option value="wrong_item">Wrong item</option>
          <option value="excess">Excess</option>
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
