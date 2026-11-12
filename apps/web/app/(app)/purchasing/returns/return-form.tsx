"use client";

import { useActionState, useState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter, FormSectionLabel } from "@erp/ui/form";
import { LineItemEditor, type EditableLine } from "@/components/line-item-editor";
import { PlusIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { createPurchaseReturnAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

interface GrnOption {
  id: string;
  docNumber: string;
  supplierId: string;
  lines: { productVariantId: string; receivedQty: number; unitCost: number }[];
}

function blankLine(variants: { id: string; label: string }[]): EditableLine {
  return { productVariantId: variants[0]?.id ?? "", quantity: 1, unitCost: 0 };
}

export function PurchaseReturnForm({
  branches,
  warehouses,
  suppliers,
  variants,
  grns,
}: {
  branches: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  suppliers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
  grns: GrnOption[];
}) {
  const [state, formAction, pending] = useActionState(createPurchaseReturnAction, undefined);
  useActionToast(state, pending, "Purchase return posted.");
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [grnId, setGrnId] = useState("");
  const [lines, setLines] = useState<EditableLine[]>([blankLine(variants)]);

  const availableGrns = grns.filter((g) => g.supplierId === supplierId);
  const total = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

  function handleSupplierChange(id: string) {
    setSupplierId(id);
    setGrnId("");
    setLines([blankLine(variants)]);
  }

  function handleGrnChange(id: string) {
    setGrnId(id);
    if (!id) {
      setLines([blankLine(variants)]);
      return;
    }
    const grn = grns.find((g) => g.id === id);
    if (grn) {
      setLines(grn.lines.map((l) => ({ productVariantId: l.productVariantId, quantity: l.receivedQty, unitCost: l.unitCost })));
    }
  }

  return (
    <form action={formAction} className="flex h-full flex-col">
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      <input type="hidden" name="grnId" value={grnId} />
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
        <Label>Supplier</Label>
        <select
          name="supplierId"
          required
          value={supplierId}
          onChange={(e) => handleSupplierChange(e.target.value)}
          className={inputClass}
        >
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <FormSectionLabel>Sourcing</FormSectionLabel>
      <div className="col-span-3">
        <Label>Original GRN (optional)</Label>
        <select value={grnId} onChange={(e) => handleGrnChange(e.target.value)} className={inputClass}>
          <option value="">— No GRN, return directly —</option>
          {availableGrns.map((g) => (
            <option key={g.id} value={g.id}>
              {g.docNumber} — {g.lines.length} item{g.lines.length === 1 ? "" : "s"} received
            </option>
          ))}
        </select>
        {availableGrns.length === 0 && (
          <p className="mt-1 text-xs text-slate-400">No GRNs on file for this supplier.</p>
        )}
      </div>

      <div className="col-span-3">
        <Label>Reason</Label>
        <select name="reason" required className={inputClass} defaultValue="damaged">
          <option value="damaged">Damaged</option>
          <option value="wrong_item">Wrong item</option>
          <option value="excess">Excess</option>
          <option value="other">Other</option>
        </select>
      </div>

      <LineItemEditor variants={variants} lines={lines} onChange={setLines} costLabel="Unit cost" />

      <div>
        <Label>Return date</Label>
        <input name="returnDate" type="date" required className={inputClass} />
      </div>
      <div className="col-span-2">
        <Label>Note (optional)</Label>
        <input name="note" className={inputClass} />
      </div>

      <div className="col-span-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Items returned</span>
          <span className="font-medium text-slate-900">{lines.length}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
          <span>Debit note total</span>
          <span>{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">Will reduce the amount owed to this supplier.</p>
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Submit return"}
        </Button>
      </FormFooter>
    </form>
  );
}
