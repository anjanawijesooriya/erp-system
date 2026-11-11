"use client";

import { useActionState, useState } from "react";
import { Button } from "@erp/ui/button";
import { LineItemEditor, type EditableLine } from "@/components/line-item-editor";
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
  const [lines, setLines] = useState<EditableLine[]>([
    { productVariantId: variants[0]?.id ?? "", quantity: 1, unitCost: 0 },
  ]);

  return (
    <form action={formAction} className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Branch</label>
        <select name="branchId" required className={inputClass}>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Supplier</label>
        <select name="supplierId" required className={inputClass}>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Order date</label>
        <input name="orderDate" type="date" required className={inputClass} />
      </div>

      <LineItemEditor variants={variants} lines={lines} onChange={setLines} costLabel="Unit cost" />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Expected date (optional)</label>
        <input name="expectedDate" type="date" className={inputClass} />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Note (optional)</label>
        <input name="note" className={inputClass} />
      </div>
      {state?.error && <p className="col-span-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Create purchase order"}
        </Button>
      </div>
    </form>
  );
}
