"use client";

import { useActionState, useState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter } from "@erp/ui/form";
import { LineItemEditor, type EditableLine } from "@/components/line-item-editor";
import { PlusIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { createQuotationAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function QuotationForm({
  branches,
  customers,
  variants,
}: {
  branches: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createQuotationAction, undefined);
  useActionToast(state, pending, "Quotation created.");
  const [lines, setLines] = useState<EditableLine[]>([
    { productVariantId: variants[0]?.id ?? "", quantity: 1, unitCost: 0 },
  ]);

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

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
          <Label>Quote date</Label>
          <input name="quoteDate" type="date" required className={inputClass} />
        </div>
        <div>
          <Label>Expires on (optional)</Label>
          <input name="validUntil" type="date" className={inputClass} />
        </div>

        <LineItemEditor variants={variants} lines={lines} onChange={setLines} costLabel="Rate" />

        <div className="col-span-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Terms &amp; notes (optional)</Label>
            <textarea
              name="note"
              rows={4}
              className={`${inputClass} resize-none py-2.5`}
              placeholder="This quotation is valid for 7 days from the date of issue…"
            />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-medium text-slate-900">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
              <span>Quoted total</span>
              <span>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Convert to a sales order once accepted.</p>
          </div>
        </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Create quotation"}
        </Button>
      </FormFooter>
    </form>
  );
}
