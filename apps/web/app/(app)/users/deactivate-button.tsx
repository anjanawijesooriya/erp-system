"use client";

import { useTransition } from "react";
import { deactivateUserAction, reactivateUserAction } from "./actions";

export function DeactivateButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={(e) => {
        e.stopPropagation();
        startTransition(() => (isActive ? deactivateUserAction(userId) : reactivateUserAction(userId)));
      }}
      className={`text-xs font-medium hover:underline ${isActive ? "text-danger-600" : "text-brand-700"}`}
    >
      {pending ? "..." : isActive ? "Deactivate" : "Reactivate"}
    </button>
  );
}
