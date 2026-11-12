"use client";

import { useActionState, useState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter, FormSectionLabel } from "@erp/ui/form";
import { LineItemEditor, type EditableLine } from "@/components/line-item-editor";
import { PlusIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { createSalesReturnAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

interface InvoiceOption {
  id: string;
  docNumber: string;
  customerId: string;
  lines: { productVariantId: string; qty: number; unitPrice: number }[];
}

function blankLine(variants: { id: string; label: string }[]): EditableLine {
  return { productVariantId: variants[0]?.id ?? "", quantity: 1, unitCost: 0 };
}

export function SalesReturnForm({
  branches,
  warehouses,
  customers,
  variants,
  invoices,
}: {
  branches: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
  invoices: InvoiceOption[];
}) {
  const [state, formAction, pending] = useActionState(createSalesReturnAction, undefined);
  useActionToast(state, pending, "Sales return posted.");
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [invoiceId, setInvoiceId] = useState("");
  const [lines, setLines] = useState<EditableLine[]>([blankLine(variants)]);

  const availableInvoices = invoices.filter((inv) => inv.customerId === customerId);
  const total = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

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
      setLines(inv.lines.map((l) => ({ productVariantId: l.productVariantId, quantity: l.qty, unitCost: l.unitPrice })));
    }
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
        <select name="warehouseId" required className={inputClass}>
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
        <Label>Original invoice (optional)</Label>
        <select value={invoiceId} onChange={(e) => handleInvoiceChange(e.target.value)} className={inputClass}>
          <option value="">— No invoice, return directly —</option>
          {availableInvoices.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.docNumber} — {inv.lines.length} item{inv.lines.length === 1 ? "" : "s"} purchased
            </option>
          ))}
        </select>
        {availableInvoices.length === 0 && (
          <p className="mt-1 text-xs text-slate-400">No invoices on file for this customer.</p>
        )}
      </div>

      <div className="col-span-3">
        <Label>Reason</Label>
        <select name="reason" required className={inputClass} defaultValue="customer_changed_mind">
          <option value="damaged">Damaged</option>
          <option value="wrong_item">Wrong item</option>
          <option value="customer_changed_mind">Customer changed mind</option>
          <option value="other">Other</option>
        </select>
      </div>

      <LineItemEditor variants={variants} lines={lines} onChange={setLines} costLabel="Rate" />

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
          <span>Refund total</span>
          <span>{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Process return"}
        </Button>
      </FormFooter>
    </form>
  );
}
