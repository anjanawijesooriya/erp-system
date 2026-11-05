"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { createProductAction } from "./actions";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

export function ProductForm() {
  const [state, formAction, pending] = useActionState(createProductAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">SKU</label>
        <input name="sku" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
        <input name="name" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Base unit code</label>
        <input name="baseUomCode" required placeholder="PCS" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Barcode (optional)</label>
        <input name="barcode" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Cost price</label>
        <input name="costPrice" type="number" step="0.01" min="0" defaultValue="0" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Selling price</label>
        <input name="sellingPrice" type="number" step="0.01" min="0" defaultValue="0" className={inputClass} />
      </div>
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-600">Description (optional)</label>
        <input name="description" className={inputClass} />
      </div>
      {state?.error && <p className="col-span-2 text-sm text-red-600">{state.error}</p>}
      <div className="col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Add product"}
        </Button>
      </div>
    </form>
  );
}
