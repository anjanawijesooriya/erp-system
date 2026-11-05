"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { createSupplierInvoiceAction } from "./actions";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

export function SupplierInvoiceForm({
  branches,
  suppliers,
  variants,
}: {
  branches: { id: string; name: string }[];
  suppliers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createSupplierInvoiceAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Branch</label>
        <select name="branchId" required className={inputClass}>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Supplier</label>
        <select name="supplierId" required className={inputClass}>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Invoice date</label>
        <input name="invoiceDate" type="date" required className={inputClass} />
      </div>
      <div className="col-span-3">
        <label className="mb-1 block text-xs font-medium text-slate-600">Product</label>
        <select name="productVariantId" required className={inputClass}>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Quantity</label>
        <input name="quantity" type="number" step="0.01" min="0.0001" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Unit cost</label>
        <input name="unitCost" type="number" step="0.01" min="0" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Supplier ref # (optional)</label>
        <input name="supplierRefNumber" className={inputClass} />
      </div>
      <div className="col-span-3">
        <label className="mb-1 block text-xs font-medium text-slate-600">Note (optional)</label>
        <input name="note" className={inputClass} />
      </div>
      <p className="col-span-3 text-xs text-slate-500">
        Due date is calculated automatically from the supplier&apos;s credit terms.
      </p>
      {state?.error && <p className="col-span-3 text-sm text-red-600">{state.error}</p>}
      <div className="col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Record invoice"}
        </Button>
      </div>
    </form>
  );
}
