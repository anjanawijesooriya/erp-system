"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { closePeriodAction } from "./actions";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

export function PeriodForm() {
  const [state, formAction, pending] = useActionState(closePeriodAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Period start</label>
        <input name="periodStart" type="date" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Period end</label>
        <input name="periodEnd" type="date" required className={inputClass} />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending} variant="destructive" className="w-full">
          {pending ? "Closing..." : "Close period"}
        </Button>
      </div>
      {state?.error && <p className="col-span-3 text-sm text-red-600">{state.error}</p>}
      <p className="col-span-3 text-xs text-slate-500">
        Closing a period blocks any new journal entry dated inside it, including auto-posting from
        GRNs, invoices, payments, deliveries and returns. There is no undo — reopening a closed
        period isn&apos;t supported in this version.
      </p>
    </form>
  );
}
