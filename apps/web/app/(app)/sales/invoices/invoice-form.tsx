"use client";

import { useActionState, useState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter } from "@erp/ui/form";
import { LineItemEditor, type EditableLine } from "@/components/line-item-editor";
import { ReceiptIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { createSalesInvoiceAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function SalesInvoiceForm({
  branches,
  customers,
  variants,
}: {
  branches: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createSalesInvoiceAction, undefined);
  useActionToast(state, pending, "Sales invoice recorded.");

  const [lines, setLines] = useState<EditableLine[]>([
    { productVariantId: variants[0]?.id ?? "", quantity: 1, unitCost: 0 },
  ]);
  const [discountPercent, setDiscountPercent] = useState("0");

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);
  const discount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const total = subtotal * (1 - discount / 100);

  return (
    <form action={formAction} className="flex h-full flex-col">
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      <input type="hidden" name="discountPercent" value={discountPercent} />
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
          <Label>Invoice date</Label>
          <input name="invoiceDate" type="date" required className={inputClass} />
        </div>

        <LineItemEditor variants={variants} lines={lines} onChange={setLines} costLabel="Unit price" />

        <div className="col-span-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Notes (optional)</Label>
            <textarea name="note" rows={4} className={`${inputClass} resize-none py-2.5`} placeholder="Notes or payment terms for this invoice…" />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-medium text-slate-900">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
              <span>Discount</span>
              <span className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-16 rounded-md border border-slate-300 px-2 py-1 text-right text-sm"
                />
                <span className="text-slate-400">%</span>
              </span>
            </div>
            <div className="mt-3 border-t border-slate-200 pt-3 flex items-center justify-between text-base font-semibold text-slate-900">
              <span>Total due</span>
              <span>{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
        <p className="col-span-3 text-xs text-slate-500">
          Due date is calculated automatically from the customer&apos;s credit terms.
        </p>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <ReceiptIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Record invoice"}
        </Button>
      </FormFooter>
    </form>
  );
}
