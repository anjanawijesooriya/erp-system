"use client";

import { useActionState, useState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter } from "@erp/ui/form";
import { LineItemEditor, type EditableLine } from "@/components/line-item-editor";
import { PlusIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { createPurchaseOrderAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function PurchaseOrderForm({
  branches,
  suppliers,
  variants,
}: {
  branches: { id: string; name: string }[];
  suppliers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createPurchaseOrderAction, undefined);
  useActionToast(state, pending, "Purchase order created.");
  const [lines, setLines] = useState<EditableLine[]>([
    { productVariantId: variants[0]?.id ?? "", quantity: 1, unitCost: 0 },
  ]);

  return (
    <form action={formAction} className="flex h-full flex-col">
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
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
        <Label>Supplier</Label>
        <select name="supplierId" required className={inputClass}>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Order date</Label>
        <input name="orderDate" type="date" required className={inputClass} />
      </div>

      <LineItemEditor variants={variants} lines={lines} onChange={setLines} costLabel="Unit cost" />

      <div>
        <Label>Expected date (optional)</Label>
        <input name="expectedDate" type="date" className={inputClass} />
      </div>
      <div className="col-span-2">
        <Label>Note (optional)</Label>
        <input name="note" className={inputClass} />
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Create purchase order"}
        </Button>
      </FormFooter>
    </form>
  );
}
