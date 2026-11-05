"use client";

import { useTransition } from "react";
import { deactivateUserAction } from "./actions";

export function DeactivateButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => deactivateUserAction(userId))}
      className="text-xs text-red-600 hover:underline"
    >
      {pending ? "..." : "Deactivate"}
    </button>
  );
}
