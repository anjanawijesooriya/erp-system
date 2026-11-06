"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { runPayrollAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";
const now = new Date();

export function RunPayrollForm({ branches }: { branches: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(runPayrollAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="col-span-2">
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
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Year</label>
        <input type="number" name="periodYear" required defaultValue={now.getFullYear()} className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Month</label>
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
      {state?.error && <p className="col-span-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Running..." : "Run payroll"}
        </Button>
      </div>
    </form>
  );
}
