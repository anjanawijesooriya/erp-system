"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { inviteAccountantAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function InviteAccountantForm() {
  const [state, formAction, pending] = useActionState(inviteAccountantAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Accountant name</label>
        <input name="name" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
        <input type="email" name="email" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Password (only used if this is their first company — ignored if they already have a portal login)
        </label>
        <input type="password" name="password" minLength={8} required className={inputClass} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" name="canPostJournals" id="canPostJournals" className="h-4 w-4" />
        <label htmlFor="canPostJournals" className="text-sm">
          Can post journals / close periods
        </label>
      </div>
      {state?.error && <p className="col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Inviting..." : "Invite accountant"}
        </Button>
      </div>
    </form>
  );
}
