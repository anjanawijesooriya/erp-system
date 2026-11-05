"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { createProductionOrderAction } from "./actions";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

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
    <form action={formAction} className="grid grid-cols-4 gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Branch</label>
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
        <label className="mb-1 block text-xs font-medium text-slate-600">Warehouse</label>
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
        <label className="mb-1 block text-xs font-medium text-slate-600">BOM</label>
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
        <label className="mb-1 block text-xs font-medium text-slate-600">Planned batches</label>
        <input type="number" step="0.01" name="plannedBatches" required defaultValue={1} className={inputClass} />
      </div>
      {state?.error && <p className="col-span-4 text-sm text-red-600">{state.error}</p>}
      <div className="col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create production order"}
        </Button>
      </div>
    </form>
  );
}
