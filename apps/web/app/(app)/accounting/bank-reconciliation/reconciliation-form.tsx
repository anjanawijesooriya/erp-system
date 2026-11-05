"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { completeReconciliationAction } from "./actions";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

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

  return (
    <form action={formAction} className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Bank account code</label>
          <input name="bankAccountCode" defaultValue="1010" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Statement date</label>
          <input name="statementDate" type="date" required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Statement balance</label>
          <input name="statementBalance" type="number" step="0.01" required className={inputClass} />
        </div>
      </div>

      <table className="mb-3 w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            <th className="py-1">✓</th>
            <th className="py-1">Date</th>
            <th className="py-1">Doc #</th>
            <th className="py-1 text-right">Debit</th>
            <th className="py-1 text-right">Credit</th>
          </tr>
        </thead>
        <tbody>
          {unreconciled.map((t) => (
            <tr key={t.lineId} className="border-t border-slate-100">
              <td className="py-1">
                <input type="checkbox" name="clearedLineIds" value={t.lineId} defaultChecked />
              </td>
              <td className="py-1">{t.entryDate}</td>
              <td className="py-1">{t.docNumber}</td>
              <td className="py-1 text-right">{Number(t.debit) > 0 ? t.debit : ""}</td>
              <td className="py-1 text-right">{Number(t.credit) > 0 ? t.credit : ""}</td>
            </tr>
          ))}
          {unreconciled.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-slate-400">
                Nothing outstanding to reconcile.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {state?.error && <p className="mb-2 text-sm text-red-600">{state.error}</p>}
      {state?.variance !== undefined && (
        <p className="mb-2 text-sm">
          Cleared balance: {state.clearedBalance} · Variance: {state.variance}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Completing..." : "Complete reconciliation"}
      </Button>
    </form>
  );
}
