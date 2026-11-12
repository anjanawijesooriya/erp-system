"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter } from "@erp/ui/form";
import { PlusIcon } from "./icons";
import { useActionToast } from "@/lib/use-action-toast";

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
  useActionToast(state, pending, `${submitLabel} succeeded.`);

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
        <Label>Customer</Label>
        <select name="customerId" required className={inputClass}>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>{dateLabel}</Label>
        <input name={dateFieldName} type="date" required className={inputClass} />
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
        <Label>Unit price</Label>
        <input name="unitPrice" type="number" step="0.01" min="0" required className={inputClass} />
      </div>
      {showValidUntil && (
        <div>
          <Label>Valid until (optional)</Label>
          <input name="validUntil" type="date" className={inputClass} />
        </div>
      )}
      <div className="col-span-3">
        <Label>Note (optional)</Label>
        <input name="note" className={inputClass} />
      </div>
      {helperText && <p className="col-span-3 text-xs text-slate-500">{helperText}</p>}
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : submitLabel}
        </Button>
      </FormFooter>
    </form>
  );
}
