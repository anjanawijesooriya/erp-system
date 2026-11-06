"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { linkProductAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function LinkProductForm({ channelId }: { channelId: string }) {
  const [state, formAction, pending] = useActionState(linkProductAction, undefined);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="channelId" value={channelId} />
      <input name="sku" placeholder="Internal SKU" required className={inputClass} />
      <input name="externalSku" placeholder="Channel SKU" required className={inputClass} />
      <Button type="submit" disabled={pending} className="shrink-0">
        {pending ? "..." : "Link"}
      </Button>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
