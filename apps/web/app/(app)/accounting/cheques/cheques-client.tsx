"use client";

import { useState } from "react";
import { Card, EmptyState, StatTile } from "@erp/ui/card";
import { Badge, type BadgeTone } from "@erp/ui/badge";
import { Button } from "@erp/ui/button";
import { Sheet } from "@erp/ui/sheet";
import { PlusIcon, CreditCardIcon } from "@/components/icons";
import { ChequeForm } from "./cheque-form";
import { ChequeStatusActions } from "./cheque-actions";

export interface ChequeRow {
  id: string;
  chequeNumber: string;
  direction: "received" | "issued";
  partyName: string;
  chequeDate: string;
  amount: string;
  bankName: string | null;
  status: string;
}

const STATUS_TONE: Record<string, BadgeTone> = {
  pending: "amber",
  deposited: "sky",
  cleared: "accent",
  bounced: "rose",
  cancelled: "slate",
};

export function ChequesClient({
  cheques,
  branches,
  customers,
  suppliers,
  canManage,
}: {
  cheques: ChequeRow[];
  branches: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  suppliers: { id: string; label: string }[];
  canManage: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState<"issued" | "received">("issued");

  const now = new Date();
  const outstanding = cheques.filter((c) => c.status === "pending" || c.status === "deposited");
  const clearedThisMonth = cheques.filter((c) => {
    if (c.status !== "cleared") return false;
    const d = new Date(c.chequeDate);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const bounced = cheques.filter((c) => c.status === "bounced");
  const outstandingValue = outstanding.reduce((sum, c) => sum + Number(c.amount), 0);

  const tabRows = cheques.filter((c) => c.direction === tab);

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <StatTile label="Outstanding" value={outstanding.length} tone="amber" />
        <StatTile label="Cleared this month" value={clearedThisMonth.length} tone="accent" />
        <StatTile label="Bounced" value={bounced.length} tone="rose" />
        <StatTile label="Outstanding value" value={outstandingValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
      </div>

      {canManage && branches.length > 0 && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            Record cheque
          </Button>
        </div>
      )}

      <div className="mb-4 flex gap-7 border-b border-slate-200">
        {(["issued", "received"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-0.5 py-2.5 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "border-brand-700 text-brand-700" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tabRows.length === 0 ? (
        <Card>
          <EmptyState icon={<CreditCardIcon className="h-5 w-5" />} title={`No ${tab} cheques yet.`} description="Track issued and received cheques through to clearing." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Cheque no.</th>
                <th className="px-4 py-2.5">{tab === "issued" ? "Payee" : "Payer"}</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5">Bank</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {tabRows.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 font-medium text-brand-700">#{c.chequeNumber}</td>
                  <td className="px-4 py-2.5 text-slate-900">{c.partyName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{c.chequeDate}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-900">{Number(c.amount).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-slate-600">{c.bankName ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={STATUS_TONE[c.status] ?? "slate"}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5">{canManage && <ChequeStatusActions chequeId={c.id} status={c.status} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Record cheque"
        description="Track an issued or received cheque through to clearing."
        icon={<CreditCardIcon className="h-4 w-4" />}
      >
        <ChequeForm branches={branches} customers={customers} suppliers={suppliers} onDone={() => setCreateOpen(false)} />
      </Sheet>
    </>
  );
}
