"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { Badge } from "@erp/ui/badge";
import { completeReconciliationAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

interface Transaction {
  lineId: string;
  entryDate: string;
  docNumber: string;
  memo: string | null;
  referenceType: string;
  debit: string;
  credit: string;
  isReconciled: boolean;
}

export function ReconciliationForm({ transactions }: { transactions: Transaction[] }) {
  const [state, formAction, pending] = useActionState(completeReconciliationAction, undefined);
  const unreconciled = transactions.filter((t) => !t.isReconciled);
  const [checked, setChecked] = useState<Set<string>>(new Set(unreconciled.map((t) => t.lineId)));
  const [statementBalance, setStatementBalance] = useState("");

  const selectedTotal = useMemo(
    () =>
      unreconciled
        .filter((t) => checked.has(t.lineId))
        .reduce((sum, t) => sum + (Number(t.debit) - Number(t.credit)), 0),
    [unreconciled, checked],
  );
  const variance = statementBalance === "" ? null : Number(statementBalance) - selectedTotal;

  function toggle(lineId: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  }

  return (
    <form action={formAction} className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div>
          <Label>Bank account code</Label>
          <input name="bankAccountCode" defaultValue="1010" className={inputClass} />
        </div>
        <div>
          <Label>Statement date</Label>
          <input name="statementDate" type="date" required className={inputClass} />
        </div>
        <div>
          <Label>Statement closing balance</Label>
          <input
            name="statementBalance"
            type="number"
            step="0.01"
            required
            value={statementBalance}
            onChange={(e) => setStatementBalance(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mb-3 overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="w-10 px-3 py-2" />
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {unreconciled.map((t) => {
              const amount = Number(t.debit) - Number(t.credit);
              return (
                <tr key={t.lineId} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      name="clearedLineIds"
                      value={t.lineId}
                      checked={checked.has(t.lineId)}
                      onChange={() => toggle(t.lineId)}
                      className="h-4 w-4 accent-brand-700"
                    />
                  </td>
                  <td className="px-3 py-2 text-slate-600">{t.entryDate}</td>
                  <td className="px-3 py-2 text-slate-900">
                    {t.docNumber}
                    {t.memo ? ` — ${t.memo}` : ""}
                  </td>
                  <td className={`px-3 py-2 text-right font-medium ${amount < 0 ? "text-slate-900" : "text-slate-900"}`}>
                    {amount >= 0 ? "+" : ""}
                    {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={checked.has(t.lineId) ? "accent" : "slate"}>{checked.has(t.lineId) ? "Matched" : "Pending"}</Badge>
                  </td>
                </tr>
              );
            })}
            {unreconciled.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-400">
                  Nothing outstanding to reconcile.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm">
        <span className="text-slate-600">
          Selected total: <strong className="text-slate-900">{selectedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
        </span>
        <span className="text-slate-600">
          Variance:{" "}
          <strong className={variance === null ? "text-slate-400" : Math.abs(variance) < 0.005 ? "text-success-700" : "text-danger-600"}>
            {variance === null ? "—" : variance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </strong>
        </span>
      </div>

      {state?.error && <p className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.variance !== undefined && (
        <p className="mb-2 text-sm text-slate-600">
          Reconciliation completed — cleared balance {state.clearedBalance}, variance {state.variance}.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Completing..." : "Mark reconciliation complete"}
      </Button>
    </form>
  );
}
