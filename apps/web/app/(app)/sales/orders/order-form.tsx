"use client";

import { useActionState, useState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter } from "@erp/ui/form";
import { LineItemEditor, type EditableLine } from "@/components/line-item-editor";
import { PlusIcon, AlertTriangleIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { createSalesOrderAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

interface Availability {
  productVariantId: string;
  available: number;
}

export function SalesOrderForm({
  branches,
  customers,
  variants,
  availability,
}: {
  branches: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
  availability: Availability[];
}) {
  const [state, formAction, pending] = useActionState(createSalesOrderAction, undefined);
  useActionToast(state, pending, "Sales order created.");
  const [lines, setLines] = useState<EditableLine[]>([
    { productVariantId: variants[0]?.id ?? "", quantity: 1, unitCost: 0 },
  ]);

  const variantLabel = (id: string) => variants.find((v) => v.id === id)?.label ?? id;
  const availableFor = (id: string) => availability.find((a) => a.productVariantId === id)?.available ?? 0;
  const backorderedLines = lines.filter((l) => l.quantity > availableFor(l.productVariantId));
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
          <Label>Order date</Label>
          <input name="orderDate" type="date" required className={inputClass} />
        </div>

        <LineItemEditor variants={variants} lines={lines} onChange={setLines} costLabel="Unit price" />

        <div className="col-span-3 -mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
          {lines.map((l, i) => (
            <span key={i}>
              {variantLabel(l.productVariantId)}: available{" "}
              <strong className={availableFor(l.productVariantId) < l.quantity ? "text-danger-600" : "text-success-700"}>
                {availableFor(l.productVariantId)}
              </strong>
            </span>
          ))}
        </div>

        {backorderedLines.length > 0 && (
          <div className="col-span-3 flex items-start gap-2.5 rounded-lg border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
            <AlertTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              {backorderedLines.map((l) => `${variantLabel(l.productVariantId)}: ordering ${l.quantity}, only ${availableFor(l.productVariantId)} in stock`).join("; ")}.
              This order will be partially backordered.
            </span>
          </div>
        )}

        <div className="col-span-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Notes (optional)</Label>
            <textarea name="note" rows={4} className={`${inputClass} resize-none py-2.5`} placeholder="Delivery preferences, special handling…" />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-medium text-slate-900">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
              <span>Order total</span>
              <span>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Convert to an invoice once ready to bill.</p>
          </div>
        </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Create sales order"}
        </Button>
      </FormFooter>
    </form>
  );
}
