"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter } from "@erp/ui/form";
import { useToast } from "@erp/ui/toast";
import { PlusIcon } from "@/components/icons";
import { createProductionOrderAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function ProductionOrderForm({
  branches,
  warehouses,
  boms,
  onDone,
}: {
  branches: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  boms: { id: string; label: string }[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(createProductionOrderAction, undefined);
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
      toast("Production order created.", "success");
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <form action={formAction} className="flex h-full flex-col">
      <FormBody>
      <div>
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
      <div className="col-span-2">
        <Label>Warehouse</Label>
        <select name="warehouseId" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Select warehouse
          </option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <Label>Bill of materials</Label>
        <select name="bomId" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Select BOM
          </option>
          {boms.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Planned batches</Label>
        <input type="number" step="0.01" name="plannedBatches" required defaultValue={1} className={inputClass} />
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Creating..." : "Create production order"}
        </Button>
      </FormFooter>
    </form>
  );
}
