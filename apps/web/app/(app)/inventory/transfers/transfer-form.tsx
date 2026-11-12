"use client";

import { useActionState, useState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter } from "@erp/ui/form";
import { PlusIcon, SwapIcon, AlertTriangleIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { createTransferAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

interface StockRow {
  warehouseId: string;
  productVariantId: string;
  quantity: number;
}

interface TransferLine {
  productVariantId: string;
  quantity: number;
  batchNumber?: string;
}

function blankLine(variants: { id: string; label: string }[]): TransferLine {
  return { productVariantId: variants[0]?.id ?? "", quantity: 1 };
}

export function TransferForm({
  warehouses,
  variants,
  stock,
}: {
  warehouses: { id: string; name: string }[];
  variants: { id: string; label: string }[];
  stock: StockRow[];
}) {
  const [state, formAction, pending] = useActionState(createTransferAction, undefined);
  useActionToast(state, pending, "Stock transferred.");
  const [fromWarehouseId, setFromWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [toWarehouseId, setToWarehouseId] = useState(warehouses[1]?.id ?? warehouses[0]?.id ?? "");
  const [lines, setLines] = useState<TransferLine[]>([blankLine(variants)]);

  const variantLabel = (id: string) => variants.find((v) => v.id === id)?.label ?? id;
  const availableFor = (productVariantId: string) =>
    stock.find((s) => s.warehouseId === fromWarehouseId && s.productVariantId === productVariantId)?.quantity ?? 0;
  const shortLines = lines.filter((l) => l.quantity > availableFor(l.productVariantId));
  const fromWarehouseName = warehouses.find((w) => w.id === fromWarehouseId)?.name ?? "";

  function updateLine(index: number, patch: Partial<TransferLine>) {
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
      <div>
        <Label>From warehouse</Label>
        <select
          name="fromWarehouseId"
          required
          value={fromWarehouseId}
          onChange={(e) => setFromWarehouseId(e.target.value)}
          className={inputClass}
        >
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>To warehouse</Label>
        <select
          name="toWarehouseId"
          required
          value={toWarehouseId}
          onChange={(e) => setToWarehouseId(e.target.value)}
          className={inputClass}
        >
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <div className="col-span-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Items to transfer</span>
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
                <th className="w-32 px-3 py-2">Available at {fromWarehouseName}</th>
                <th className="w-28 px-3 py-2">Transfer qty</th>
                <th className="w-8 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const available = availableFor(l.productVariantId);
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
                    <td className={`px-3 py-1.5 font-medium ${available < l.quantity ? "text-danger-600" : "text-success-700"}`}>
                      {available}
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

      {shortLines.length > 0 && (
        <div className="col-span-3 flex items-start gap-2.5 rounded-lg border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          <AlertTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            {shortLines.map((l) => `${variantLabel(l.productVariantId)}: transferring ${l.quantity}, only ${availableFor(l.productVariantId)} available`).join("; ")}.
          </span>
        </div>
      )}

      <div className="col-span-3">
        <Label>Note (optional)</Label>
        <input name="note" className={inputClass} placeholder="Courier, expected arrival, handling instructions…" />
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <SwapIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Transfer stock"}
        </Button>
      </FormFooter>
    </form>
  );
}
