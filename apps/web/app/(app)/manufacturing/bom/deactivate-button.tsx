"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@erp/ui/dialog";
import { deactivateBomAction } from "./actions";

export function DeactivateBomButton({ bomId }: { bomId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deactivateBomAction(bomId);
      setConfirming(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setConfirming(true);
        }}
        className="text-xs font-medium text-danger-600 hover:underline"
      >
        Deactivate
      </button>
      <ConfirmDialog
        open={confirming}
        title="Deactivate this BOM?"
        description="Existing production orders are unaffected."
        confirmLabel="Deactivate"
        variant="destructive"
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
