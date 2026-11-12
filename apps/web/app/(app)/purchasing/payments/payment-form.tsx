"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { Badge, type BadgeTone } from "@erp/ui/badge";
import { FormBody, FormFooter, FormSectionLabel } from "@erp/ui/form";
import { CreditCardIcon } from "@/components/icons";
import { useActionToast } from "@/lib/use-action-toast";
import { createSupplierPaymentAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

const BUCKET_TONE: Record<string, BadgeTone> = {
  current: "accent",
  "1-30": "amber",
  "31-60": "amber",
  "61-90": "rose",
  "90+": "rose",
};

const METHODS: { value: "bank" | "cheque" | "cash"; label: string }[] = [
  { value: "bank", label: "Bank transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "cash", label: "Cash" },
];

interface OutstandingInvoice {
  invoiceId: string;
  docNumber: string;
  supplierId: string;
  dueDate: string;
  amountDue: string;
  daysPastDue: number;
  bucket: string;
}

export function SupplierPaymentForm({
  branches,
  suppliers,
  outstanding,
}: {
  branches: { id: string; name: string }[];
  suppliers: { id: string; label: string }[];
  outstanding: OutstandingInvoice[];
}) {
  const [state, formAction, pending] = useActionState(createSupplierPaymentAction, undefined);
  useActionToast(state, pending, "Payment recorded.");
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [method, setMethod] = useState<"bank" | "cheque" | "cash">("bank");
  const [payAmounts, setPayAmounts] = useState<Record<string, string>>({});

  const supplierInvoices = outstanding.filter((o) => o.supplierId === supplierId);
  const totalDue = supplierInvoices.reduce((sum, o) => sum + Number(o.amountDue), 0);

  const allocations = useMemo(
    () =>
      supplierInvoices
        .filter((inv) => (payAmounts[inv.invoiceId] ?? "") !== "" && Number(payAmounts[inv.invoiceId]) > 0)
        .map((inv) => ({ invoiceId: inv.invoiceId, amount: Number(payAmounts[inv.invoiceId]) })),
    [supplierInvoices, payAmounts],
  );
  const totalPayment = allocations.reduce((sum, a) => sum + a.amount, 0);

  function handleSupplierChange(id: string) {
    setSupplierId(id);
    setPayAmounts({});
  }

  function toggleInvoice(inv: OutstandingInvoice) {
    setPayAmounts((prev) => {
      const next = { ...prev };
      if ((prev[inv.invoiceId] ?? "") !== "") {
        delete next[inv.invoiceId];
      } else {
        next[inv.invoiceId] = inv.amountDue;
      }
      return next;
    });
  }

  function setAmount(invoiceId: string, value: string) {
    setPayAmounts((prev) => ({ ...prev, [invoiceId]: value }));
  }

  return (
    <form action={formAction} className="flex h-full flex-col">
      <input type="hidden" name="allocations" value={JSON.stringify(allocations)} />
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
        <Label>Payment date</Label>
        <input name="paymentDate" type="date" required className={inputClass} />
      </div>

      <div className="col-span-3">
        <Label>Payment method</Label>
        <div className="flex gap-2.5">
          {METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMethod(m.value)}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                method === m.value
                  ? "border-brand-700 bg-brand-50 text-brand-700"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="method" value={method} />
      </div>

      <FormSectionLabel>Outstanding bills — select what this payment covers</FormSectionLabel>
      <div className="col-span-3">
        {supplierInvoices.length > 0 && (
          <p className="mb-1.5 text-right text-xs text-slate-500">Total due: {totalDue.toLocaleString()}</p>
        )}
        {supplierInvoices.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">
            No outstanding invoices for this supplier.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="w-10 px-3 py-2" />
                  <th className="px-3 py-2">Invoice</th>
                  <th className="px-3 py-2">Due date</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Balance</th>
                  <th className="w-32 px-3 py-2 text-right">Pay amount</th>
                </tr>
              </thead>
              <tbody>
                {supplierInvoices.map((inv) => {
                  const checked = (payAmounts[inv.invoiceId] ?? "") !== "";
                  return (
                    <tr key={inv.invoiceId} className={`border-t border-slate-100 ${checked ? "bg-brand-50/60" : ""}`}>
                      <td className="px-3 py-1.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleInvoice(inv)}
                          className="h-4 w-4 accent-brand-700"
                        />
                      </td>
                      <td className="px-3 py-1.5 font-medium text-slate-900">{inv.docNumber}</td>
                      <td className="px-3 py-1.5 text-slate-600">{inv.dueDate}</td>
                      <td className="px-3 py-1.5">
                        <Badge tone={BUCKET_TONE[inv.bucket] ?? "slate"}>
                          {inv.daysPastDue > 0 ? `${inv.daysPastDue}d overdue` : "current"}
                        </Badge>
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium text-slate-900">{Number(inv.amountDue).toLocaleString()}</td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={!checked}
                          value={payAmounts[inv.invoiceId] ?? ""}
                          onChange={(e) => setAmount(inv.invoiceId, e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-sm disabled:bg-slate-50 disabled:text-slate-400"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-1 text-xs text-slate-400">Check a bill to pay it down; adjust the amount for a partial payment.</p>
      </div>

      <div className="col-span-3">
        <Label>Note (optional)</Label>
        <input name="note" className={inputClass} />
      </div>

      <div className="col-span-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Bills selected</span>
          <span className="font-medium text-slate-900">{allocations.length}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
          <span>Total payment</span>
          <span>{totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending || allocations.length === 0} className="gap-1.5">
          <CreditCardIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Record payment"}
        </Button>
      </FormFooter>
    </form>
  );
}
