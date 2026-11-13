"use client";

import { useState } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Badge } from "@erp/ui/badge";
import { Sheet, DetailRow, DetailSection } from "@erp/ui/sheet";
import { ReceiptIcon } from "@/components/icons";
import { EntryActions } from "./entry-row";

interface EntryLine {
  id: string;
  debit: string;
  credit: string;
  description: string | null;
  account: { code: string; name: string };
}

interface Entry {
  id: string;
  docNumber: string;
  entryDate: string;
  memo: string | null;
  branchId: string;
  referenceType: string;
  reversalOfEntryId: string | null;
  lines: EntryLine[];
}

export function JournalClient({ entries, canPost }: { entries: Entry[]; canPost: boolean }) {
  const [selected, setSelected] = useState<Entry | null>(null);

  return (
    <>
      {entries.length === 0 ? (
        <Card>
          <EmptyState icon={<ReceiptIcon className="h-5 w-5" />} title="No journal entries yet." description="Post one above, or let the system post them automatically from your documents." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Recent entries</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">JE no.</th>
                <th className="px-4 py-2.5">Memo</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const amount = e.lines.reduce((sum, l) => sum + Number(l.debit), 0);
                return (
                  <tr
                    key={e.id}
                    onClick={() => setSelected(e)}
                    className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-2.5 font-medium text-brand-700">{e.docNumber}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {e.memo || <span className="capitalize text-slate-400">{e.referenceType.replace(/_/g, " ")}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{e.entryDate}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900">{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={e.reversalOfEntryId ? "amber" : "accent"}>{e.reversalOfEntryId ? "Reversal" : "Posted"}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.docNumber ?? ""}
        description="Journal entry details"
        icon={<ReceiptIcon className="h-4 w-4" />}
        width="md"
      >
        {selected && (
          <>
            <DetailSection title="Overview">
              <DetailRow label="Date" value={selected.entryDate} />
              <DetailRow label="Reference" value={<span className="capitalize">{selected.referenceType.replace(/_/g, " ")}</span>} />
              {selected.memo && <DetailRow label="Memo" value={selected.memo} />}
              {selected.reversalOfEntryId && <DetailRow label="Type" value={<Badge tone="amber">Reversal</Badge>} />}
            </DetailSection>
            <DetailSection title="Lines">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Account</th>
                      <th className="px-3 py-2 text-right">Debit</th>
                      <th className="px-3 py-2 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lines.map((l) => (
                      <tr key={l.id} className="border-t border-slate-100">
                        <td className="px-3 py-1.5">
                          {l.account.code} — {l.account.name}
                          {l.description && <div className="text-xs text-slate-400">{l.description}</div>}
                        </td>
                        <td className="px-3 py-1.5 text-right">{Number(l.debit) > 0 ? Number(l.debit).toFixed(2) : ""}</td>
                        <td className="px-3 py-1.5 text-right">{Number(l.credit) > 0 ? Number(l.credit).toFixed(2) : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DetailSection>
            {canPost && !selected.reversalOfEntryId && (
              <div className="px-5 py-4">
                <EntryActions entryId={selected.id} branchId={selected.branchId} canPost={canPost} isReversal={false} />
              </div>
            )}
          </>
        )}
      </Sheet>
    </>
  );
}
