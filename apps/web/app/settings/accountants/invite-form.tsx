"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { inviteAccountantAction } from "./actions";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

export function InviteAccountantForm() {
  const [state, formAction, pending] = useActionState(inviteAccountantAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Accountant name</label>
        <input name="name" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
        <input type="email" name="email" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
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
      {state?.error && <p className="col-span-2 text-sm text-red-600">{state.error}</p>}
      <div className="col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Inviting..." : "Invite accountant"}
        </Button>
      </div>
    </form>
  );
}
