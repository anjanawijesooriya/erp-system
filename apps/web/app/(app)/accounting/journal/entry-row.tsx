"use client";

import { useTransition } from "react";
import { voidJournalEntryAction } from "./actions";

export function EntryActions({
  entryId,
  branchId,
  canPost,
  isReversal,
}: {
  entryId: string;
  branchId: string;
  canPost: boolean;
  isReversal: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (!canPost || isReversal) return null;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => voidJournalEntryAction(entryId, branchId))}
      className="text-xs text-red-600"
    >
      {pending ? "Reversing..." : "Reverse"}
    </button>
  );
}
