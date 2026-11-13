"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter } from "@erp/ui/form";
import { useToast } from "@erp/ui/toast";
import { PlusIcon } from "@/components/icons";
import { createAccountAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function AccountForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(createAccountAction, undefined);
  const toast = useToast();
  const wasPending = useRef(false);

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      return;
    }
    if (!wasPending.current) return;
    wasPending.current = false;

    if (state?.error) {
      toast(state.error, "error");
    } else {
      toast("Account added.", "success");
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <form action={formAction} className="flex h-full flex-col">
      <FormBody>
      <div>
        <Label>Code</Label>
        <input name="code" required placeholder="e.g. 1050" className={inputClass} />
      </div>
      <div className="col-span-2">
        <Label>Account name</Label>
        <input name="name" required placeholder="e.g. Petty cash" className={inputClass} />
      </div>
      <div className="col-span-3">
        <Label>Type</Label>
        <select name="type" required defaultValue="asset" className={inputClass}>
          <option value="asset">Asset</option>
          <option value="liability">Liability</option>
          <option value="equity">Equity</option>
          <option value="income">Revenue</option>
          <option value="expense">Expense</option>
        </select>
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Add account"}
        </Button>
      </FormFooter>
    </form>
  );
}
