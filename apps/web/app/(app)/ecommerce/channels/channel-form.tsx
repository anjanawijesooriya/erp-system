"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { createChannelAction } from "./actions";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

export function ChannelForm() {
  const [state, formAction, pending] = useActionState(createChannelAction, undefined);

  return (
    <form action={formAction} className="flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">Channel name</label>
        <input name="name" required placeholder="e.g. Main Website" className={inputClass} />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Add channel"}
      </Button>
    </form>
  );
}
