"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { Input, Label, Select } from "@erp/ui/input";
import { recordExpenseAction } from "./actions";

export function ExpenseForm({
  branches,
  accounts,
}: {
  branches: { id: string; name: string }[];
  accounts: { code: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(recordExpenseAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
      <div>
        <Label htmlFor="expenseDate">Date</Label>
        <Input id="expenseDate" name="expenseDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
      </div>
      <div>
        <Label htmlFor="branchId">Branch</Label>
        <Select id="branchId" name="branchId" required defaultValue="">
          <option value="" disabled>
            Select...
          </option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="accountCode">Expense category</Label>
        <Select id="accountCode" name="accountCode" required defaultValue="">
          <option value="" disabled>
            Select...
          </option>
          {accounts.map((a) => (
            <option key={a.code} value={a.code}>
              {a.code} — {a.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="amount">Amount (LKR)</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" />
      </div>
      <div>
        <Label htmlFor="paidFrom">Paid from</Label>
        <Select id="paidFrom" name="paidFrom" required defaultValue="1000">
          <option value="1000">Cash in hand</option>
          <option value="1010">Bank</option>
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="description">What was this for?</Label>
        <Input id="description" name="description" required placeholder="e.g. Electricity bill for October" />
      </div>
      {state?.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
          {state.error}
        </p>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Recording..." : "Record expense"}
        </Button>
      </div>
    </form>
  );
}
