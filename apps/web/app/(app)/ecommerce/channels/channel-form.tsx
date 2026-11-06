"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { createChannelAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function ChannelForm() {
  const [state, formAction, pending] = useActionState(createChannelAction, undefined);

  return (
    <form action={formAction} className="flex items-end gap-3 rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="flex-1">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Channel name</label>
        <input name="name" required placeholder="e.g. Main Website" className={inputClass} />
      </div>
      {state?.error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Add channel"}
      </Button>
    </form>
  );
}
