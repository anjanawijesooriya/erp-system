"use client";

import { useTransition } from "react";
import { updateChequeStatusAction } from "./actions";

export function ChequeStatusActions({ chequeId, status }: { chequeId: string; status: string }) {
  const [pending, startTransition] = useTransition();

  if (status === "cleared" || status === "bounced" || status === "cancelled") {
    return <span className="text-xs text-slate-400">—</span>;
  }

  return (
    <div className="flex gap-2 text-xs">
      {status === "pending" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => updateChequeStatusAction(chequeId, "deposited"))}
          className="text-slate-600 hover:underline"
        >
          Deposit
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => updateChequeStatusAction(chequeId, "cleared"))}
        className="text-green-700 hover:underline"
      >
        Clear
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => updateChequeStatusAction(chequeId, "bounced"))}
        className="text-red-600 hover:underline"
      >
        Bounce
      </button>
    </div>
  );
}
