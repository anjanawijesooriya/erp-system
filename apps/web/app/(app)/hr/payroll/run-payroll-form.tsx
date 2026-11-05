"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { runPayrollAction } from "./actions";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
const now = new Date();

export function RunPayrollForm({ branches }: { branches: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(runPayrollAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-4 gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="col-span-2">
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
        <label className="mb-1 block text-xs font-medium text-slate-600">Year</label>
        <input type="number" name="periodYear" required defaultValue={now.getFullYear()} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Month</label>
        <input
          type="number"
          name="periodMonth"
          min={1}
          max={12}
          required
          defaultValue={now.getMonth() + 1}
          className={inputClass}
        />
      </div>
      {state?.error && <p className="col-span-4 text-sm text-red-600">{state.error}</p>}
      <div className="col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Running..." : "Run payroll"}
        </Button>
      </div>
    </form>
  );
}
