"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter } from "@erp/ui/form";
import { useToast } from "@erp/ui/toast";
import { PlusIcon } from "@/components/icons";
import { recordChequeAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function ChequeForm({
  branches,
  customers,
  suppliers,
  onDone,
}: {
  branches: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  suppliers: { id: string; label: string }[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(recordChequeAction, undefined);
  const [direction, setDirection] = useState<"received" | "issued">("received");
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
      toast("Cheque recorded.", "success");
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

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
      <div className="col-span-2">
        <Label>Direction</Label>
        <select
          name="direction"
          value={direction}
          onChange={(e) => setDirection(e.target.value as "received" | "issued")}
          className={inputClass}
        >
          <option value="received">Received (from customer)</option>
          <option value="issued">Issued (to supplier)</option>
        </select>
      </div>
      {direction === "received" ? (
        <div className="col-span-3">
          <Label>Customer</Label>
          <select name="customerId" required className={inputClass}>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="col-span-3">
          <Label>Supplier</Label>
          <select name="supplierId" required className={inputClass}>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <Label>Cheque number</Label>
        <input name="chequeNumber" required className={inputClass} />
      </div>
      <div>
        <Label>Bank name</Label>
        <input name="bankName" className={inputClass} />
      </div>
      <div>
        <Label>Cheque date</Label>
        <input name="chequeDate" type="date" required className={inputClass} />
      </div>
      <div className="col-span-3">
        <Label>Amount</Label>
        <input name="amount" type="number" step="0.01" min="0.01" required className={inputClass} />
      </div>
      <div className="col-span-3">
        <Label>Note (optional)</Label>
        <input name="note" className={inputClass} />
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Record cheque"}
        </Button>
      </FormFooter>
    </form>
  );
}
