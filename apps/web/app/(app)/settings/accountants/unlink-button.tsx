"use client";

import { useTransition } from "react";
import { unlinkAccountantAction } from "./actions";

export function UnlinkAccountantButton({ accountantId }: { accountantId: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm("Remove this accountant's access to your company?")) return;
    startTransition(async () => {
      await unlinkAccountantAction(accountantId);
    });
  }

  return (
    <button onClick={onClick} disabled={pending} className="text-xs text-red-600 hover:underline disabled:opacity-50">
      {pending ? "..." : "Remove access"}
    </button>
  );
}
