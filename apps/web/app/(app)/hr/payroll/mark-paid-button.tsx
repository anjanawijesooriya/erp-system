"use client";

import { useState, useTransition } from "react";
import { Button } from "@erp/ui/button";
import { markPayrollPaidAction } from "./actions";

export function MarkPaidButton({ payrollRunId }: { payrollRunId: string }) {
  const [account, setAccount] = useState<"1000" | "1010">("1010");
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(() => markPayrollPaidAction(payrollRunId, account));
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={account}
        onChange={(e) => setAccount(e.target.value as "1000" | "1010")}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        <option value="1010">Pay from bank</option>
        <option value="1000">Pay from cash in hand</option>
      </select>
      <Button onClick={onClick} disabled={pending} className="gap-1.5">
        {pending ? "Paying..." : "Approve & pay"}
      </Button>
    </div>
  );
}
