"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";

type PartyAction = (
  prevState: { error?: string } | undefined,
  formData: FormData,
) => Promise<{ error?: string }>;

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function PartyForm({ action, submitLabel }: { action: PartyAction; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Code (optional)</label>
        <input name="code" className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
        <input name="name" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
        <input name="phone" className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" className={inputClass} />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Address</label>
        <input name="address" className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Tax ID</label>
        <input name="taxId" className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Credit limit</label>
        <input name="creditLimit" type="number" step="0.01" min="0" defaultValue="0" className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Credit term (days)</label>
        <input name="creditTermDays" type="number" min="0" defaultValue="0" className={inputClass} />
      </div>
      {state?.error && <p className="col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
