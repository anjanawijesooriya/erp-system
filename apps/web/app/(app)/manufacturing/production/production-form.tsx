"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { createProductionOrderAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function ProductionOrderForm({
  branches,
  warehouses,
  boms,
}: {
  branches: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  boms: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createProductionOrderAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Branch</label>
        <select name="branchId" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Select...
          </option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Warehouse</label>
        <select name="warehouseId" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Select...
          </option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">BOM</label>
        <select name="bomId" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Select...
          </option>
          {boms.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Planned batches</label>
        <input type="number" step="0.01" name="plannedBatches" required defaultValue={1} className={inputClass} />
      </div>
      {state?.error && <p className="col-span-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create production order"}
        </Button>
      </div>
    </form>
  );
}
