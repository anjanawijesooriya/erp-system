"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter } from "@erp/ui/form";
import { SwapIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { createTransferAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function TransferForm({
  warehouses,
  variants,
}: {
  warehouses: { id: string; name: string }[];
  variants: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createTransferAction, undefined);
  useActionToast(state, pending, "Stock transferred.");

  return (
    <form action={formAction} className="flex h-full flex-col">
      <FormBody className="sm:grid-cols-2">
      <div>
        <Label>From warehouse</Label>
        <select name="fromWarehouseId" required className={inputClass}>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>To warehouse</Label>
        <select name="toWarehouseId" required className={inputClass}>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
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
        <Label>Quantity</Label>
        <input name="quantity" type="number" step="0.01" min="0.01" required className={inputClass} />
      </div>
      <div>
        <Label>Note (optional)</Label>
        <input name="note" className={inputClass} />
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <SwapIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Transfer stock"}
        </Button>
      </FormFooter>
    </form>
  );
}
