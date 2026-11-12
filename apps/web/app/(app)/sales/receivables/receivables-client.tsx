"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, EmptyState } from "@erp/ui/card";
import { Badge, type BadgeTone } from "@erp/ui/badge";
import { Pagination } from "@erp/ui/pagination";
import { ReceiptIcon, SearchIcon, WalletIcon } from "@/components/icons";

interface ReceivablesRow {
  invoiceId: string;
  docNumber: string;
  customerId: string;
  customerName: string;
  dueDate: string;
  amountDue: string;
  daysPastDue: number;
  bucket: string;
}

const BUCKET_TONE: Record<string, BadgeTone> = {
  current: "accent",
  "1-30": "amber",
  "31-60": "amber",
  "61-90": "rose",
  "90+": "rose",
};

function statusLabel(row: ReceivablesRow) {
  if (row.daysPastDue > 0) return `${row.daysPastDue}d overdue`;
  if (row.daysPastDue >= -5) return `Due in ${Math.abs(row.daysPastDue)}d`;
  return "Current";
}

const PAGE_SIZE = 8;

export function ReceivablesClient({ rows }: { rows: ReceivablesRow[] }) {
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [agingFilter, setAgingFilter] = useState<"all" | "overdue">("all");
  const [page, setPage] = useState(1);

  const customers = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) map.set(r.customerId, r.customerName);
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (customerId && r.customerId !== customerId) return false;
    if (agingFilter === "overdue" && r.daysPastDue <= 0) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.customerName.toLowerCase().includes(q) && !r.docNumber.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function updateFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <Card className="flex flex-1 flex-wrap items-center gap-3 p-3.5">
          <div className="relative min-w-[240px] flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => updateFilter(() => setSearch(e.target.value))}
              placeholder="Search by customer or invoice no..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <select
            value={customerId}
            onChange={(e) => updateFilter(() => setCustomerId(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="">All customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={agingFilter}
            onChange={(e) => updateFilter(() => setAgingFilter(e.target.value as "all" | "overdue"))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="all">All aging</option>
            <option value="overdue">Overdue only</option>
          </select>
        </Card>
        <Link
          href="/sales/invoices"
          className="flex h-[52px] flex-shrink-0 items-center gap-1.5 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
        >
          <ReceiptIcon className="h-4 w-4" />
          New invoice
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={<WalletIcon className="h-5 w-5" />} title="No outstanding receivables." description="Everything owed by customers is settled." />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<SearchIcon className="h-5 w-5" />} title="No matching invoices." description="Try a different search or filter." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Invoice</th>
                <th className="px-4 py-2.5">Due date</th>
                <th className="px-4 py-2.5 text-right">Balance</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.invoiceId} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 font-medium text-slate-900">{r.customerName}</td>
                  <td className="px-4 py-2.5 font-medium text-brand-700">{r.docNumber}</td>
                  <td className="px-4 py-2.5 text-slate-600">{r.dueDate}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-900">{Number(r.amountDue).toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={BUCKET_TONE[r.bucket] ?? "slate"}>{statusLabel(r)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
            summary={`Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} open invoices`}
          />
        </Card>
      )}
    </>
  );
}
