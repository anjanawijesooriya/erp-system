"use client";

import { useActionState, useState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter, FormSectionLabel } from "@erp/ui/form";
import { LineItemEditor, type EditableLine } from "@/components/line-item-editor";
import { PlusIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { createSupplierInvoiceAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

interface UninvoicedGrn {
  id: string;
  docNumber: string;
  supplierId: string;
  lines: { productVariantId: string; quantity: number; unitCost: number }[];
}

function blankLine(variants: { id: string; label: string }[]): EditableLine {
  return { productVariantId: variants[0]?.id ?? "", quantity: 1, unitCost: 0 };
}

export function SupplierInvoiceForm({
  branches,
  suppliers,
  variants,
  grns,
}: {
  branches: { id: string; name: string }[];
  suppliers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
  grns: UninvoicedGrn[];
}) {
  const [state, formAction, pending] = useActionState(createSupplierInvoiceAction, undefined);
  useActionToast(state, pending, "Supplier invoice recorded.");
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [grnId, setGrnId] = useState("");
  const [lines, setLines] = useState<EditableLine[]>([blankLine(variants)]);

  const availableGrns = grns.filter((g) => g.supplierId === supplierId);

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
      setLines(grn.lines.map((l) => ({ productVariantId: l.productVariantId, quantity: l.quantity, unitCost: l.unitCost })));
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
      <div>
        <Label>Invoice date</Label>
        <input name="invoiceDate" type="date" required className={inputClass} />
      </div>

      <FormSectionLabel>Sourcing</FormSectionLabel>
      <div className="col-span-3">
        <Label>Bill from GRN (optional)</Label>
        <select value={grnId} onChange={(e) => handleGrnChange(e.target.value)} className={inputClass}>
          <option value="">— No GRN, enter items manually —</option>
          {availableGrns.map((g) => (
            <option key={g.id} value={g.id}>
              {g.docNumber} — {g.lines.length} item{g.lines.length === 1 ? "" : "s"} received
            </option>
          ))}
        </select>
        {availableGrns.length === 0 && (
          <p className="mt-1 text-xs text-slate-400">No un-invoiced GRNs for this supplier.</p>
        )}
      </div>

      <LineItemEditor variants={variants} lines={lines} onChange={setLines} costLabel="Unit cost" />

      <div>
        <Label>Supplier ref # (optional)</Label>
        <input name="supplierRefNumber" className={inputClass} />
      </div>
      <div className="col-span-2">
        <Label>Note (optional)</Label>
        <input name="note" className={inputClass} />
      </div>
      <p className="col-span-3 text-xs text-slate-500">
        Due date is calculated automatically from the supplier&apos;s credit terms.
      </p>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Record invoice"}
        </Button>
      </FormFooter>
    </form>
  );
}
