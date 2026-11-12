"use client";

import { useActionState, useState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter } from "@erp/ui/form";
import { PlusIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { createAdjustmentAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

interface AdjustmentLine {
  productVariantId: string;
  direction: "increase" | "decrease";
  quantity: number;
  unitCost: number;
}

function blankLine(variants: { id: string; label: string }[], direction: "increase" | "decrease"): AdjustmentLine {
  return { productVariantId: variants[0]?.id ?? "", direction, quantity: 1, unitCost: 0 };
}

export function AdjustmentForm({
  warehouses,
  variants,
}: {
  warehouses: { id: string; name: string }[];
  variants: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createAdjustmentAction, undefined);
  useActionToast(state, pending, "Adjustment posted.");
  const [defaultDirection, setDefaultDirection] = useState<"increase" | "decrease">("increase");
  const [lines, setLines] = useState<AdjustmentLine[]>([blankLine(variants, "increase")]);

  const signedLines = lines.map((l) => ({
    productVariantId: l.productVariantId,
    quantityDelta: l.direction === "increase" ? l.quantity : -l.quantity,
    unitCost: l.unitCost,
  }));

  function updateLine(index: number, patch: Partial<AdjustmentLine>) {
    setLines(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines([...lines, blankLine(variants, defaultDirection)]);
  }

  function removeLine(index: number) {
    setLines(lines.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="flex h-full flex-col">
      <input type="hidden" name="lines" value={JSON.stringify(signedLines)} />
      <FormBody>
      <div>
        <Label>Warehouse</Label>
        <select name="warehouseId" required className={inputClass}>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Reason</Label>
        <select name="reason" required className={inputClass} defaultValue="correction">
          <option value="damage">Damage</option>
          <option value="theft_loss">Theft / loss</option>
          <option value="expiry">Expiry</option>
          <option value="correction">Correction</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="col-span-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Items to adjust</span>
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-800"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add line
          </button>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="w-32 px-3 py-2">Direction</th>
                <th className="w-24 px-3 py-2">Qty</th>
                <th className="w-28 px-3 py-2">Unit cost</th>
                <th className="w-8 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-3 py-1.5">
                    <select
                      value={l.productVariantId}
                      onChange={(e) => updateLine(i, { productVariantId: e.target.value })}
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    >
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => updateLine(i, { direction: "increase" })}
                        className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors ${
                          l.direction === "increase"
                            ? "border-success-600 bg-success-50 text-success-700"
                            : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        + In
                      </button>
                      <button
                        type="button"
                        onClick={() => updateLine(i, { direction: "decrease" })}
                        className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors ${
                          l.direction === "decrease"
                            ? "border-danger-600 bg-danger-50 text-danger-700"
                            : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        − Out
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={l.quantity}
                      onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={l.direction === "decrease"}
                      value={l.unitCost}
                      onChange={(e) => updateLine(i, { unitCost: Number(e.target.value) })}
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </td>
                  <td className="px-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      disabled={lines.length === 1}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400">Unit cost only applies when increasing stock — decreases use the warehouse's current average cost.</p>
      </div>

      <div className="col-span-3">
        <Label>Default direction for new rows</Label>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => setDefaultDirection("increase")}
            className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
              defaultDirection === "increase"
                ? "border-success-600 bg-success-50 text-success-700"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Increase stock
          </button>
          <button
            type="button"
            onClick={() => setDefaultDirection("decrease")}
            className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
              defaultDirection === "decrease"
                ? "border-danger-600 bg-danger-50 text-danger-700"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Decrease stock
          </button>
        </div>
      </div>

      <div className="col-span-3">
        <Label>Note (optional)</Label>
        <input name="note" className={inputClass} placeholder="Context for this adjustment, approver, etc…" />
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Apply adjustment"}
        </Button>
      </FormFooter>
    </form>
  );
}
