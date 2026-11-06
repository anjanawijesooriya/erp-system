"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

type DocAction = (
  prevState: { error?: string } | undefined,
  formData: FormData,
) => Promise<{ error?: string }>;

/** Shared single-line-item form for quotations, sales orders and sales invoices. */
export function SalesDocForm({
  action,
  branches,
  customers,
  variants,
  dateFieldName,
  dateLabel,
  submitLabel,
  showValidUntil,
  helperText,
}: {
  action: DocAction;
  branches: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
  dateFieldName: string;
  dateLabel: string;
  submitLabel: string;
  showValidUntil?: boolean;
  helperText?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-white shadow-sm p-4">
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
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Customer</label>
        <select name="customerId" required className={inputClass}>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">{dateLabel}</label>
        <input name={dateFieldName} type="date" required className={inputClass} />
      </div>
      <div className="col-span-3">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Product</label>
        <select name="productVariantId" required className={inputClass}>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Quantity</label>
        <input name="quantity" type="number" step="0.01" min="0.0001" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Unit price</label>
        <input name="unitPrice" type="number" step="0.01" min="0" required className={inputClass} />
      </div>
      {showValidUntil && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Valid until (optional)</label>
          <input name="validUntil" type="date" className={inputClass} />
        </div>
      )}
      <div className="col-span-3">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Note (optional)</label>
        <input name="note" className={inputClass} />
      </div>
      {helperText && <p className="col-span-3 text-xs text-slate-500">{helperText}</p>}
      {state?.error && <p className="col-span-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
