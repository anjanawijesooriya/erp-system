"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter } from "@erp/ui/form";
import { PlusIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { createPurchaseReturnAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function PurchaseReturnForm({
  branches,
  warehouses,
  suppliers,
  variants,
}: {
  branches: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  suppliers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createPurchaseReturnAction, undefined);
  useActionToast(state, pending, "Purchase return posted.");

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
        <Label>Supplier</Label>
        <select name="supplierId" required className={inputClass}>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-3">
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
        <Label>Return date</Label>
        <input name="returnDate" type="date" required className={inputClass} />
      </div>
      <div>
        <Label>Reason</Label>
        <select name="reason" required className={inputClass} defaultValue="damaged">
          <option value="damaged">Damaged</option>
          <option value="wrong_item">Wrong item</option>
          <option value="excess">Excess</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="col-span-3">
        <Label>Note (optional)</Label>
        <input name="note" className={inputClass} />
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Post return"}
        </Button>
      </FormFooter>
    </form>
  );
}
