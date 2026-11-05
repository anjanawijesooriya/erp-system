"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";

type PartyAction = (
  prevState: { error?: string } | undefined,
  formData: FormData,
) => Promise<{ error?: string }>;

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

export function PartyForm({ action, submitLabel }: { action: PartyAction; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Code (optional)</label>
        <input name="code" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
        <input name="name" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Phone</label>
        <input name="phone" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
        <input name="email" type="email" className={inputClass} />
      </div>
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-600">Address</label>
        <input name="address" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Tax ID</label>
        <input name="taxId" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Credit limit</label>
        <input name="creditLimit" type="number" step="0.01" min="0" defaultValue="0" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Credit term (days)</label>
        <input name="creditTermDays" type="number" min="0" defaultValue="0" className={inputClass} />
      </div>
      {state?.error && <p className="col-span-2 text-sm text-red-600">{state.error}</p>}
      <div className="col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
