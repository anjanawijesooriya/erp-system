"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { createProductAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function ProductForm() {
  const [state, formAction, pending] = useActionState(createProductAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">SKU</label>
        <input name="sku" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
        <input name="name" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Base unit code</label>
        <input name="baseUomCode" required placeholder="PCS" className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Barcode (optional)</label>
        <input name="barcode" className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Cost price</label>
        <input name="costPrice" type="number" step="0.01" min="0" defaultValue="0" className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Selling price</label>
        <input name="sellingPrice" type="number" step="0.01" min="0" defaultValue="0" className={inputClass} />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Description (optional)</label>
        <input name="description" className={inputClass} />
      </div>
      {state?.error && <p className="col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Add product"}
        </Button>
      </div>
    </form>
  );
}
