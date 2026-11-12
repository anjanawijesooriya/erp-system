"use client";

import { useActionState, useState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { Badge, type BadgeTone } from "@erp/ui/badge";
import { FormBody, FormFooter } from "@erp/ui/form";
import { PlusIcon, ClipboardIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { submitStockCountAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

interface StockRow {
  warehouseId: string;
  productVariantId: string;
  quantity: number;
}

interface CountLine {
  productVariantId: string;
  countedQuantity: string;
}

function blankLine(variants: { id: string; label: string }[]): CountLine {
  return { productVariantId: variants[0]?.id ?? "", countedQuantity: "" };
}

export function StockCountForm({
  warehouses,
  variants,
  stock,
}: {
  warehouses: { id: string; name: string }[];
  variants: { id: string; label: string }[];
  stock: StockRow[];
}) {
  const [state, formAction, pending] = useActionState(submitStockCountAction, undefined);
  useActionToast(state, pending, "Stock count submitted.");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [lines, setLines] = useState<CountLine[]>([blankLine(variants)]);

  const systemQtyFor = (productVariantId: string) =>
    stock.find((s) => s.warehouseId === warehouseId && s.productVariantId === productVariantId)?.quantity ?? 0;

  const countedLines = lines.filter((l) => l.countedQuantity !== "");
  const varianceCount = countedLines.filter((l) => Number(l.countedQuantity) !== systemQtyFor(l.productVariantId)).length;
  const netVarianceValue = countedLines.reduce(
    (sum, l) => sum + (Number(l.countedQuantity) - systemQtyFor(l.productVariantId)),
    0,
  );

  const payloadLines = countedLines.map((l) => ({
    productVariantId: l.productVariantId,
    countedQuantity: Number(l.countedQuantity),
  }));

  function updateLine(index: number, patch: Partial<CountLine>) {
    setLines(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines([...lines, blankLine(variants)]);
  }

  function removeLine(index: number) {
    setLines(lines.filter((_, i) => i !== index));
  }

  function statusFor(l: CountLine): { label: string; tone: BadgeTone } {
    if (l.countedQuantity === "") return { label: "Pending", tone: "slate" };
    const variance = Number(l.countedQuantity) - systemQtyFor(l.productVariantId);
    if (variance === 0) return { label: "Matched", tone: "slate" };
    if (variance > 0) return { label: "Over", tone: "accent" };
    return { label: "Short", tone: "rose" };
  }

  return (
    <form action={formAction} className="flex h-full flex-col">
      <input type="hidden" name="lines" value={JSON.stringify(payloadLines)} />
      <FormBody>
      <div>
        <Label>Warehouse</Label>
        <select
          name="warehouseId"
          required
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          className={inputClass}
        >
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <div className="col-span-3 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <div className="text-xs text-slate-500">Items counted</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {countedLines.length} / {lines.length}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <div className="text-xs text-slate-500">Items with variance</div>
          <div className="mt-1 text-lg font-semibold text-warning-700">{varianceCount}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <div className="text-xs text-slate-500">Net variance (qty)</div>
          <div className={`mt-1 text-lg font-semibold ${netVarianceValue < 0 ? "text-danger-600" : netVarianceValue > 0 ? "text-success-700" : "text-slate-900"}`}>
            {netVarianceValue > 0 ? "+" : ""}
            {netVarianceValue}
          </div>
        </div>
      </div>

      <div className="col-span-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Count sheet</span>
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
                <th className="px-3 py-2">Item</th>
                <th className="w-24 px-3 py-2">System qty</th>
                <th className="w-28 px-3 py-2">Counted qty</th>
                <th className="w-20 px-3 py-2">Variance</th>
                <th className="w-24 px-3 py-2">Status</th>
                <th className="w-8 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const systemQty = systemQtyFor(l.productVariantId);
                const status = statusFor(l);
                const variance = l.countedQuantity === "" ? null : Number(l.countedQuantity) - systemQty;
                return (
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
                    <td className="px-3 py-1.5 text-slate-600">{systemQty}</td>
                    <td className="px-3 py-1.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="—"
                        value={l.countedQuantity}
                        onChange={(e) => updateLine(i, { countedQuantity: e.target.value })}
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </td>
                    <td className={`px-3 py-1.5 font-medium ${variance === null ? "text-slate-400" : variance === 0 ? "text-slate-500" : variance > 0 ? "text-success-700" : "text-danger-600"}`}>
                      {variance === null ? "—" : `${variance > 0 ? "+" : ""}${variance}`}
                    </td>
                    <td className="px-3 py-1.5">
                      <Badge tone={status.tone}>{status.label}</Badge>
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

      <div className="col-span-3">
        <Label>Note (optional)</Label>
        <input name="note" className={inputClass} />
      </div>
      <p className="col-span-3 text-xs text-slate-500">
        Submitting immediately posts any variance against the current system quantity and finalizes the count —
        there's no separate draft/review step yet. Lines left blank are skipped.
      </p>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending || countedLines.length === 0} className="gap-1.5">
          <ClipboardIcon className="h-4 w-4" />
          {pending ? "Submitting..." : "Submit count"}
        </Button>
      </FormFooter>
    </form>
  );
}
