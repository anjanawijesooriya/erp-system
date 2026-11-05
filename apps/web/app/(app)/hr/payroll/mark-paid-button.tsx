"use client";

import { useTransition } from "react";
import { markPayrollPaidAction } from "./actions";

export function MarkPaidButton({ payrollRunId }: { payrollRunId: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    const account = confirm("Pay from Bank? (Cancel = pay from Cash in Hand)") ? "1010" : "1000";
    startTransition(async () => {
      await markPayrollPaidAction(payrollRunId, account);
    });
  }

  return (
    <button onClick={onClick} disabled={pending} className="text-xs text-blue-600 hover:underline disabled:opacity-50">
      {pending ? "..." : "Mark paid"}
    </button>
  );
}
