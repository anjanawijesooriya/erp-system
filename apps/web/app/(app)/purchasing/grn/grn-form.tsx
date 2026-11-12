"use client";

import { useActionState, useState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter, FormSectionLabel } from "@erp/ui/form";
import { LineItemEditor, type EditableLine } from "@/components/line-item-editor";
import { PlusIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { createGrnAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

interface OutstandingPO {
  id: string;
  docNumber: string;
  supplierId: string;
  lines: { productVariantId: string; remainingQty: number; unitCost: number }[];
}

function blankLine(variants: { id: string; label: string }[]): EditableLine {
  return { productVariantId: variants[0]?.id ?? "", quantity: 1, unitCost: 0 };
}

export function GrnForm({
  branches,
  warehouses,
  suppliers,
  variants,
  purchaseOrders,
}: {
  branches: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  suppliers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
  purchaseOrders: OutstandingPO[];
}) {
  const [state, formAction, pending] = useActionState(createGrnAction, undefined);
  useActionToast(state, pending, "GRN posted.");
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [purchaseOrderId, setPurchaseOrderId] = useState("");
  const [lines, setLines] = useState<EditableLine[]>([blankLine(variants)]);

  const availablePOs = purchaseOrders.filter((po) => po.supplierId === supplierId);

  function handleSupplierChange(id: string) {
    setSupplierId(id);
    setPurchaseOrderId("");
    setLines([blankLine(variants)]);
  }

  function handlePoChange(id: string) {
    setPurchaseOrderId(id);
    if (!id) {
      setLines([blankLine(variants)]);
      return;
    }
    const po = purchaseOrders.find((p) => p.id === id);
    if (po) {
      setLines(po.lines.map((l) => ({ productVariantId: l.productVariantId, quantity: l.remainingQty, unitCost: l.unitCost })));
    }
  }

  return (
    <form action={formAction} className="flex h-full flex-col">
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      <input type="hidden" name="purchaseOrderId" value={purchaseOrderId} />
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
        <Label>Receive against PO (optional)</Label>
        <select value={purchaseOrderId} onChange={(e) => handlePoChange(e.target.value)} className={inputClass}>
          <option value="">— No PO, receive directly —</option>
          {availablePOs.map((po) => (
            <option key={po.id} value={po.id}>
              {po.docNumber} — {po.lines.length} item{po.lines.length === 1 ? "" : "s"} outstanding
            </option>
          ))}
        </select>
        {availablePOs.length === 0 && (
          <p className="mt-1 text-xs text-slate-400">No open purchase orders for this supplier.</p>
        )}
      </div>

      <LineItemEditor variants={variants} lines={lines} onChange={setLines} costLabel="Unit cost" showBatchExpiry />

      <div>
        <Label>Received date</Label>
        <input name="receivedDate" type="date" required className={inputClass} />
      </div>
      <div className="col-span-2">
        <Label>Note (optional)</Label>
        <input name="note" className={inputClass} />
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Post GRN"}
        </Button>
      </FormFooter>
    </form>
  );
}
