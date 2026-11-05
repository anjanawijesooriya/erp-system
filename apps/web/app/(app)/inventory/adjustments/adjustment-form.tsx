"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { createAdjustmentAction } from "./actions";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

export function AdjustmentForm({
  warehouses,
  variants,
}: {
  warehouses: { id: string; name: string }[];
  variants: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createAdjustmentAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4">
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
        <label className="mb-1 block text-xs font-medium text-slate-600">Reason</label>
        <select name="reason" required className={inputClass} defaultValue="correction">
          <option value="damage">Damage</option>
          <option value="theft_loss">Theft / loss</option>
          <option value="expiry">Expiry</option>
          <option value="correction">Correction</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="col-span-2">
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
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Quantity change (+ in, − out)
        </label>
        <input name="quantityDelta" type="number" step="0.01" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Unit cost (only used when increasing stock)
        </label>
        <input name="unitCost" type="number" step="0.01" min="0" defaultValue="0" className={inputClass} />
      </div>
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-600">Note (optional)</label>
        <input name="note" className={inputClass} />
      </div>
      {state?.error && <p className="col-span-2 text-sm text-red-600">{state.error}</p>}
      <div className="col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Post adjustment"}
        </Button>
      </div>
    </form>
  );
}
