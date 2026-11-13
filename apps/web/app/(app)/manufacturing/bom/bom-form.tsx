"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter } from "@erp/ui/form";
import { useToast } from "@erp/ui/toast";
import { PlusIcon } from "@/components/icons";
import { createBomAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

interface Variant {
  id: string;
  label: string;
  costPrice: number;
}

interface ComponentLine {
  componentVariantId: string;
  quantity: number;
}

function blankLine(variants: Variant[]): ComponentLine {
  return { componentVariantId: variants[0]?.id ?? "", quantity: 1 };
}

export function BomForm({ variants, onDone }: { variants: Variant[]; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(createBomAction, undefined);
  const toast = useToast();
  const wasPending = useRef(false);
  const [lines, setLines] = useState<ComponentLine[]>([blankLine(variants)]);

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      return;
    }
    if (!wasPending.current) return;
    wasPending.current = false;

    if (state?.error) {
      toast(state.error, "error");
    } else {
      toast("BOM created.", "success");
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const costFor = (id: string) => variants.find((v) => v.id === id)?.costPrice ?? 0;
  const componentCost = lines.reduce((sum, l) => sum + l.quantity * costFor(l.componentVariantId), 0);

  function updateLine(index: number, patch: Partial<ComponentLine>) {
    setLines(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines([...lines, blankLine(variants)]);
  }

  function removeLine(index: number) {
    setLines(lines.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="flex h-full flex-col">
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      <FormBody>
      <div className="col-span-2">
        <Label>BOM name</Label>
        <input name="name" required placeholder="e.g. Custom gaming PC — Standard build" className={inputClass} />
      </div>
      <div>
        <Label>Output quantity per batch</Label>
        <input type="number" step="0.01" name="outputQuantity" required defaultValue={1} className={inputClass} />
      </div>
      <div className="col-span-3">
        <Label>Finished product</Label>
        <select name="outputVariantId" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Select finished product
          </option>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className="col-span-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Components</span>
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-800"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add component
          </button>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Component</th>
                <th className="w-24 px-3 py-2">Qty required</th>
                <th className="w-28 px-3 py-2 text-right">Unit cost</th>
                <th className="w-28 px-3 py-2 text-right">Line cost</th>
                <th className="w-8 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const unitCost = costFor(l.componentVariantId);
                return (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-1.5">
                      <select
                        value={l.componentVariantId}
                        onChange={(e) => updateLine(i, { componentVariantId: e.target.value })}
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
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={l.quantity}
                        onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right text-slate-600">{unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-1.5 text-right font-medium text-slate-900">
                      {(unitCost * l.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="col-span-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-center justify-between text-base font-semibold text-slate-900">
          <span>Cost per unit</span>
          <span>{componentCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Create BOM"}
        </Button>
      </FormFooter>
    </form>
  );
}
