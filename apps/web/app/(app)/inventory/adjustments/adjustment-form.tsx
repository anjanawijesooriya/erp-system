"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter } from "@erp/ui/form";
import { PlusIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { createAdjustmentAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function AdjustmentForm({
  warehouses,
  variants,
}: {
  warehouses: { id: string; name: string }[];
  variants: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createAdjustmentAction, undefined);
  useActionToast(state, pending, "Adjustment posted.");

  return (
    <form action={formAction} className="flex h-full flex-col">
      <FormBody className="sm:grid-cols-2">
      <div>
        <Label>Warehouse</Label>
        <select name="warehouseId" required className={inputClass}>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Reason</Label>
        <select name="reason" required className={inputClass} defaultValue="correction">
          <option value="damage">Damage</option>
          <option value="theft_loss">Theft / loss</option>
          <option value="expiry">Expiry</option>
          <option value="correction">Correction</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="col-span-2">
        <Label>Product</Label>
        <select name="productVariantId" required className={inputClass}>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Quantity change (+ in, − out)</Label>
        <input name="quantityDelta" type="number" step="0.01" required className={inputClass} />
      </div>
      <div>
        <Label>Unit cost (only used when increasing stock)</Label>
        <input name="unitCost" type="number" step="0.01" min="0" defaultValue="0" className={inputClass} />
      </div>
      <div className="col-span-2">
        <Label>Note (optional)</Label>
        <input name="note" className={inputClass} />
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Post adjustment"}
        </Button>
      </FormFooter>
    </form>
  );
}
