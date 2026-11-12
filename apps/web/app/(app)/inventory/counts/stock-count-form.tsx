"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter } from "@erp/ui/form";
import { ClipboardIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { submitStockCountAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function StockCountForm({
  warehouses,
  variants,
}: {
  warehouses: { id: string; name: string }[];
  variants: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(submitStockCountAction, undefined);
  useActionToast(state, pending, "Stock count submitted.");

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
        <Label>Counted quantity</Label>
        <input name="countedQuantity" type="number" step="0.01" min="0" required className={inputClass} />
      </div>
      <div>
        <Label>Note (optional)</Label>
        <input name="note" className={inputClass} />
      </div>
      <p className="col-span-2 text-xs text-slate-500">
        Submitting immediately posts any variance against the current system quantity and
        finalizes the count — there's no separate draft/review step yet.
      </p>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <ClipboardIcon className="h-4 w-4" />
          {pending ? "Submitting..." : "Submit count"}
        </Button>
      </FormFooter>
    </form>
  );
}
