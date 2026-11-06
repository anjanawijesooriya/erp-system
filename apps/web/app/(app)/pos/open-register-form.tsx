"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { Input, Label } from "@erp/ui/input";
import { openRegisterAction } from "./actions";

export function OpenRegisterForm({ branchId }: { branchId: string }) {
  const [state, formAction, pending] = useActionState(openRegisterAction, undefined);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
          <rect x="3" y="7" width="18" height="12" rx="2" />
          <path d="M3 11h18M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">Register is closed</h2>
      <p className="mt-1 text-sm text-slate-500">Count the drawer and open a register to start selling.</p>

      <form action={formAction} className="mt-6 w-full space-y-4 text-left">
        <input type="hidden" name="branchId" value={branchId} />
        <div>
          <Label htmlFor="openingBalance">Opening balance (LKR)</Label>
          <Input id="openingBalance" name="openingBalance" type="number" step="0.01" min="0" required placeholder="0.00" />
        </div>
        <div>
          <Label htmlFor="note">Note (optional)</Label>
          <Input id="note" name="note" placeholder="e.g. Float from safe" />
        </div>
        {state?.error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}
        <Button type="submit" disabled={pending} size="lg" className="w-full">
          {pending ? "Opening..." : "Open register"}
        </Button>
      </form>
    </div>
  );
}
