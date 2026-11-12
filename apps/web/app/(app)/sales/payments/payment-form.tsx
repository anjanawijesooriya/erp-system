"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter } from "@erp/ui/form";
import { CreditCardIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { createSalesPaymentAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function SalesPaymentForm({
  branches,
  customers,
}: {
  branches: { id: string; name: string }[];
  customers: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createSalesPaymentAction, undefined);
  useActionToast(state, pending, "Receipt recorded.");

  return (
    <form action={formAction} className="flex h-full flex-col">
      <FormBody>
      <div>
        <Label>Branch</Label>
        <select name="branchId" required className={inputClass}>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Customer</Label>
        <select name="customerId" required className={inputClass}>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Payment date</Label>
        <input name="paymentDate" type="date" required className={inputClass} />
      </div>
      <div>
        <Label>Method</Label>
        <select name="method" required className={inputClass} defaultValue="cash">
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="cheque">Cheque</option>
        </select>
      </div>
      <div>
        <Label>Amount</Label>
        <input name="amount" type="number" step="0.01" min="0.01" required className={inputClass} />
      </div>
      <div>
        <Label>Note (optional)</Label>
        <input name="note" className={inputClass} />
      </div>
      <p className="col-span-3 text-xs text-slate-500">
        Applies against the customer&apos;s oldest outstanding invoices first.
      </p>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <CreditCardIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Record receipt"}
        </Button>
      </FormFooter>
    </form>
  );
}
