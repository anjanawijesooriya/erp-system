"use client";

import { PlusIcon } from "./icons";

export interface EditableLine {
  productVariantId: string;
  quantity: number;
  unitCost: number;
  batchNumber?: string;
  expiryDate?: string;
}

const cellInputClass =
  "w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

/** Shared editable line-item table for purchase orders, GRNs and supplier invoices. */
export function LineItemEditor({
  variants,
  lines,
  onChange,
  costLabel = "Unit cost",
  showBatchExpiry = false,
}: {
  variants: { id: string; label: string }[];
  lines: EditableLine[];
  onChange: (lines: EditableLine[]) => void;
  costLabel?: string;
  showBatchExpiry?: boolean;
}) {
  function updateLine(index: number, patch: Partial<EditableLine>) {
    onChange(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    onChange([...lines, { productVariantId: variants[0]?.id ?? "", quantity: 1, unitCost: 0 }]);
  }

  function removeLine(index: number) {
    onChange(lines.filter((_, i) => i !== index));
  }

  const total = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

  return (
    <div className="col-span-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Line items</span>
        <button
          type="button"
          onClick={addLine}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-800"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add line
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="w-28 px-3 py-2">Qty</th>
              <th className="w-32 px-3 py-2">{costLabel}</th>
              {showBatchExpiry && <th className="w-32 px-3 py-2">Batch #</th>}
              {showBatchExpiry && <th className="w-40 px-3 py-2">Expiry</th>}
              <th className="w-28 px-3 py-2 text-right">Line total</th>
              <th className="w-8 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                <td className="px-3 py-1.5">
                  <select
                    value={l.productVariantId}
                    onChange={(e) => updateLine(i, { productVariantId: e.target.value })}
                    className={cellInputClass}
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
                    className={cellInputClass}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={l.unitCost}
                    onChange={(e) => updateLine(i, { unitCost: Number(e.target.value) })}
                    className={cellInputClass}
                  />
                </td>
                {showBatchExpiry && (
                  <td className="px-3 py-1.5">
                    <input
                      value={l.batchNumber ?? ""}
                      onChange={(e) => updateLine(i, { batchNumber: e.target.value })}
                      className={cellInputClass}
                    />
                  </td>
                )}
                {showBatchExpiry && (
                  <td className="px-3 py-1.5">
                    <input
                      type="date"
                      value={l.expiryDate ?? ""}
                      onChange={(e) => updateLine(i, { expiryDate: e.target.value })}
                      className={cellInputClass}
                    />
                  </td>
                )}
                <td className="px-3 py-1.5 text-right font-medium text-slate-700">
                  {(l.quantity * l.unitCost).toLocaleString()}
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
      <p className="text-right text-sm font-semibold text-slate-900">Total: {total.toLocaleString()}</p>
    </div>
  );
}
