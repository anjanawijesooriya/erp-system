"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@erp/ui/button";
import { Badge } from "@erp/ui/badge";
import { postManualJournalAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

interface Line {
  accountCode: string;
  debit: string;
  credit: string;
  description: string;
}

function emptyLine(defaultCode: string): Line {
  return { accountCode: defaultCode, debit: "", credit: "", description: "" };
}

export function JournalForm({
  branches,
  accounts,
}: {
  branches: { id: string; name: string }[];
  accounts: { code: string; name: string }[];
}) {
  const [branchId] = useState(branches[0]?.id ?? "");
  const [entryDate, setEntryDate] = useState("");
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<Line[]>([
    emptyLine(accounts[0]?.code ?? ""),
    emptyLine(accounts[1]?.code ?? accounts[0]?.code ?? ""),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const totalDebit = useMemo(() => lines.reduce((s, l) => s + (Number(l.debit) || 0), 0), [lines]);
  const totalCredit = useMemo(() => lines.reduce((s, l) => s + (Number(l.credit) || 0), 0), [lines]);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.005 && totalDebit > 0;

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine(accounts[0]?.code ?? "")]);
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== index) : prev));
  }

  function submit() {
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.set("branchId", branchId);
    formData.set("entryDate", entryDate);
    formData.set("memo", memo);
    formData.set(
      "lines",
      JSON.stringify(
        lines.map((l) => ({
          accountCode: l.accountCode,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description || undefined,
        })),
      ),
    );

    startTransition(async () => {
      const result = await postManualJournalAction(undefined, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess("Journal entry posted.");
      setLines([emptyLine(accounts[0]?.code ?? ""), emptyLine(accounts[1]?.code ?? accounts[0]?.code ?? "")]);
      setMemo("");
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <h3 className="mb-3 text-sm font-bold text-slate-900">New journal entry</h3>
      <div className="mb-3 grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Branch</label>
          <select value={branchId} className={inputClass} disabled>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Entry date</label>
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Memo</label>
          <input value={memo} onChange={(e) => setMemo(e.target.value)} className={inputClass} />
        </div>
      </div>

      <table className="mb-3 w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            <th className="py-1">Account</th>
            <th className="py-1">Description</th>
            <th className="py-1 text-right">Debit</th>
            <th className="py-1 text-right">Credit</th>
            <th className="py-1" />
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="py-1 pr-2">
                <select
                  value={line.accountCode}
                  onChange={(e) => updateLine(i, { accountCode: e.target.value })}
                  className={inputClass}
                >
                  {accounts.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-1 pr-2">
                <input
                  value={line.description}
                  onChange={(e) => updateLine(i, { description: e.target.value })}
                  className={inputClass}
                />
              </td>
              <td className="py-1 pr-2 text-right">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={line.debit}
                  onChange={(e) => updateLine(i, { debit: e.target.value, credit: "" })}
                  className={`${inputClass} text-right`}
                />
              </td>
              <td className="py-1 pr-2 text-right">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={line.credit}
                  onChange={(e) => updateLine(i, { credit: e.target.value, debit: "" })}
                  className={`${inputClass} text-right`}
                />
              </td>
              <td className="py-1 text-right">
                <button type="button" onClick={() => removeLine(i)} className="text-xs text-red-600">
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-3 flex items-center justify-between text-sm">
        <Button type="button" variant="outline" size="sm" onClick={addLine}>
          Add line
        </Button>
        <span className="flex items-center gap-3 text-slate-600">
          <span>
            Debits <strong className="text-slate-900">{totalDebit.toFixed(2)}</strong>
          </span>
          <span>
            Credits <strong className="text-slate-900">{totalCredit.toFixed(2)}</strong>
          </span>
          <Badge tone={balanced ? "accent" : "amber"}>{balanced ? "Balanced" : "Not balanced"}</Badge>
        </span>
      </div>

      {error && <p className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && <p className="mb-2 rounded-lg border border-accent-200 bg-accent-50 px-3 py-2 text-sm text-accent-700">{success}</p>}

      <Button type="button" onClick={submit} disabled={pending || !balanced || !entryDate}>
        {pending ? "Posting..." : "Post entry"}
      </Button>
    </div>
  );
}
