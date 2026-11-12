"use client";

import { useActionState, useState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter, FormSectionLabel } from "@erp/ui/form";
import { PlusIcon, AlertTriangleIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { createDeliveryAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

interface InvoiceOption {
  id: string;
  docNumber: string;
  customerId: string;
  lines: { productVariantId: string; qty: number }[];
}

interface StockRow {
  warehouseId: string;
  productVariantId: string;
  quantity: number;
}

interface DeliveryLine {
  productVariantId: string;
  quantity: number;
  batchNumber?: string;
}

function blankLine(variants: { id: string; label: string }[]): DeliveryLine {
  return { productVariantId: variants[0]?.id ?? "", quantity: 1 };
}

export function DeliveryForm({
  branches,
  warehouses,
  customers,
  variants,
  invoices,
  stock,
}: {
  branches: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
  invoices: InvoiceOption[];
  stock: StockRow[];
}) {
  const [state, formAction, pending] = useActionState(createDeliveryAction, undefined);
  useActionToast(state, pending, "Delivery posted.");
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [invoiceId, setInvoiceId] = useState("");
  const [lines, setLines] = useState<DeliveryLine[]>([blankLine(variants)]);

  const availableInvoices = invoices.filter((inv) => inv.customerId === customerId);
  const variantLabel = (id: string) => variants.find((v) => v.id === id)?.label ?? id;
  const availableFor = (productVariantId: string) =>
    stock.find((s) => s.warehouseId === warehouseId && s.productVariantId === productVariantId)?.quantity ?? 0;
  const shortLines = lines.filter((l) => l.quantity > availableFor(l.productVariantId));

  function handleCustomerChange(id: string) {
    setCustomerId(id);
    setInvoiceId("");
    setLines([blankLine(variants)]);
  }

  function handleInvoiceChange(id: string) {
    setInvoiceId(id);
    if (!id) {
      setLines([blankLine(variants)]);
      return;
    }
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      setLines(inv.lines.map((l) => ({ productVariantId: l.productVariantId, quantity: l.qty })));
    }
  }

  function updateLine(index: number, patch: Partial<DeliveryLine>) {
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
      <input type="hidden" name="invoiceId" value={invoiceId} />
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
      <div>
        <Label>Customer</Label>
        <select
          name="customerId"
          required
          value={customerId}
          onChange={(e) => handleCustomerChange(e.target.value)}
          className={inputClass}
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <FormSectionLabel>Sourcing</FormSectionLabel>
      <div className="col-span-3">
        <Label>Linked invoice (optional)</Label>
        <select value={invoiceId} onChange={(e) => handleInvoiceChange(e.target.value)} className={inputClass}>
          <option value="">— No invoice, deliver directly —</option>
          {availableInvoices.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.docNumber} — {inv.lines.length} item{inv.lines.length === 1 ? "" : "s"} billed
            </option>
          ))}
        </select>
        {availableInvoices.length === 0 && (
          <p className="mt-1 text-xs text-slate-400">No invoices on file for this customer.</p>
        )}
      </div>

      <div className="col-span-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Items to deliver</span>
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
                <th className="w-28 px-3 py-2">Qty</th>
                <th className="w-28 px-3 py-2">Available</th>
                <th className="w-36 px-3 py-2">Batch # (optional)</th>
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
                    <td className={`px-3 py-1.5 font-medium ${available < l.quantity ? "text-danger-600" : "text-success-700"}`}>
                      {available}
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        value={l.batchNumber ?? ""}
                        onChange={(e) => updateLine(i, { batchNumber: e.target.value })}
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
        <div className="col-span-3 flex items-start gap-2.5 rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
          <AlertTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            {shortLines.map((l) => `${variantLabel(l.productVariantId)}: delivering ${l.quantity}, only ${availableFor(l.productVariantId)} in stock`).join("; ")}.
          </span>
        </div>
      )}

      <div>
        <Label>Delivery date</Label>
        <input name="deliveryDate" type="date" required className={inputClass} />
      </div>
      <div className="col-span-2">
        <Label>Delivery notes (optional)</Label>
        <input name="note" className={inputClass} placeholder="Access instructions, recipient name…" />
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Post delivery"}
        </Button>
      </FormFooter>
    </form>
  );
}
