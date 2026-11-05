"use client";

import { useTransition } from "react";
import { terminateEmployeeAction } from "./actions";

export function TerminateButton({ employeeId }: { employeeId: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm("Mark this employee as terminated as of today?")) return;
    const today = new Date().toISOString().slice(0, 10);
    startTransition(async () => {
      await terminateEmployeeAction(employeeId, today);
    });
  }

  return (
    <button onClick={onClick} disabled={pending} className="text-xs text-red-600 hover:underline disabled:opacity-50">
      {pending ? "..." : "Terminate"}
    </button>
  );
}
