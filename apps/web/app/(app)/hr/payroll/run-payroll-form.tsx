"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter } from "@erp/ui/form";
import { useToast } from "@erp/ui/toast";
import { PlusIcon } from "@/components/icons";
import { runPayrollAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";
const now = new Date();

export function RunPayrollForm({ branches, onDone }: { branches: { id: string; name: string }[]; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(runPayrollAction, undefined);
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
      toast("Payroll run posted.", "success");
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <form action={formAction} className="flex h-full flex-col">
      <FormBody>
      <div className="col-span-3">
        <Label>Branch</Label>
        <select name="branchId" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Select branch
          </option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Year</Label>
        <input type="number" name="periodYear" required defaultValue={now.getFullYear()} className={inputClass} />
      </div>
      <div className="col-span-2">
        <Label>Month</Label>
        <input type="number" name="periodMonth" min={1} max={12} required defaultValue={now.getMonth() + 1} className={inputClass} />
      </div>
      <p className="col-span-3 text-xs text-slate-500">
        Calculates EPF/ETF/APIT for every active employee at this branch and posts straight to the ledger. There's no draft step — running payroll for a period twice isn't allowed.
      </p>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Running..." : "Run payroll"}
        </Button>
      </FormFooter>
    </form>
  );
}
