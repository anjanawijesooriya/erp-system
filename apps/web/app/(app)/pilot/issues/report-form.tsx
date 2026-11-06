"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { reportIssueAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function ReportIssueForm({ branches }: { branches: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(reportIssueAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Title</label>
        <input name="title" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Severity</label>
        <select name="severity" className={inputClass} defaultValue="medium">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Description (optional)</label>
        <input name="description" className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Branch (optional)</label>
        <select name="branchId" defaultValue="" className={inputClass}>
          <option value="">—</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      {state?.error && <p className="col-span-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Reporting..." : "Report issue"}
        </Button>
      </div>
    </form>
  );
}
