"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@erp/ui/dialog";
import { terminateEmployeeAction } from "./actions";

export function TerminateButton({ employeeId }: { employeeId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    const today = new Date().toISOString().slice(0, 10);
    startTransition(async () => {
      await terminateEmployeeAction(employeeId, today);
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
        Terminate
      </button>
      <ConfirmDialog
        open={confirming}
        title="Terminate this employee?"
        description="This marks them as terminated as of today. There's no undo."
        confirmLabel="Terminate"
        variant="destructive"
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
