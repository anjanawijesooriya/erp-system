"use client";

import { useTransition } from "react";
import { deactivateBomAction } from "./actions";

export function DeactivateBomButton({ bomId }: { bomId: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm("Deactivate this BOM? Existing production orders are unaffected.")) return;
    startTransition(async () => {
      await deactivateBomAction(bomId);
    });
  }

  return (
    <button onClick={onClick} disabled={pending} className="text-xs text-red-600 hover:underline disabled:opacity-50">
      {pending ? "..." : "Deactivate"}
    </button>
  );
}
