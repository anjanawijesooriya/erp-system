"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

type ImportAction = (
  prevState: { error?: string; summary?: string } | undefined,
  formData: FormData,
) => Promise<{ error?: string; summary?: string }>;

export function OpeningBalanceForm({
  action,
  branches,
  title,
  columnsHint,
}: {
  action: ImportAction;
  branches: { id: string; name: string }[];
  title: string;
  columnsHint: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <p className="mb-3 text-xs text-slate-500">Columns: {columnsHint}</p>
      <div className="mb-3 grid grid-cols-3 gap-3">
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
          <label className="mb-1 block text-xs font-medium text-slate-600">As of date</label>
          <input name="asOfDate" type="date" required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">File</label>
          <input name="file" type="file" accept=".xlsx" required className="text-sm" />
        </div>
      </div>
      {state?.error && <p className="mb-2 text-sm text-red-600">{state.error}</p>}
      {state?.summary && <p className="mb-2 text-sm text-slate-600">{state.summary}</p>}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Importing..." : "Import"}
      </Button>
    </form>
  );
}
