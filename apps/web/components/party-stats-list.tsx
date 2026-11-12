"use client";

import { useMemo, useState } from "react";
import { Card, EmptyState, StatTile } from "@erp/ui/card";
import { Pagination } from "@erp/ui/pagination";
import { UsersIcon } from "./icons";

export interface PartyStatsRow {
  id: string;
  code: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt: string | Date;
  totalValue: number;
  balance: number;
}

const AVATAR_TONES = [
  "bg-brand-50 text-brand-700",
  "bg-success-50 text-success-700",
  "bg-warning-50 text-warning-700",
  "bg-danger-50 text-danger-700",
  "bg-info-50 text-info-700",
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function toneFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

const PAGE_SIZE = 8;

export function PartyStatsList({
  parties,
  totalLabel,
  totalValueLabel,
  emptyLabel,
}: {
  parties: PartyStatsRow[];
  /** e.g. "customers" / "suppliers", used in stat tile and empty-state copy. */
  totalLabel: string;
  /** e.g. "Total sales" / "Total purchases" column header. */
  totalValueLabel: string;
  emptyLabel: string;
}) {
  const [search, setSearch] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("");
  const [page, setPage] = useState(1);

  const monthAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);

  const newCount = parties.filter((p) => new Date(p.createdAt) >= monthAgo).length;
  const outstandingTotal = parties.reduce((sum, p) => sum + Math.max(0, p.balance), 0);
  const lifetimeTotal = parties.reduce((sum, p) => sum + p.totalValue, 0);

  const filtered = useMemo(() => {
    return parties.filter((p) => {
      if (balanceFilter === "outstanding" && p.balance <= 0.0001) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !(p.phone ?? "").toLowerCase().includes(q) &&
          !(p.email ?? "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [parties, search, balanceFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  function exportCsv() {
    const header = ["Name", "Phone", "Email", totalValueLabel, "Balance"];
    const lines = filtered.map((p) =>
      [p.name, p.phone ?? "", p.email ?? "", p.totalValue.toFixed(2), p.balance.toFixed(2)].join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${totalLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <StatTile label={`Total ${totalLabel}`} value={parties.length} />
        <StatTile label="New this month" value={`+${newCount}`} tone="accent" />
        <StatTile label="Outstanding balance" value={outstandingTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} tone="rose" />
        <StatTile label={`${totalValueLabel} (lifetime)`} value={lifetimeTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
      </div>

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name, phone or email…"
          className="min-w-[220px] flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm"
        />
        <select
          value={balanceFilter}
          onChange={(e) => {
            setBalanceFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All balances</option>
          <option value="outstanding">Has outstanding</option>
        </select>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Export
        </button>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<UsersIcon className="h-5 w-5" />} title={emptyLabel} description="Try a different search." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Phone</th>
                <th className="px-4 py-2.5 text-right">{totalValueLabel}</th>
                <th className="px-4 py-2.5 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${toneFor(p.id)}`}>
                        {initialsOf(p.name)}
                      </span>
                      <span className="font-semibold text-brand-700">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{p.phone ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-900">{p.totalValue.toLocaleString()}</td>
                  <td className={`px-4 py-2.5 text-right ${p.balance > 0.0001 ? "font-medium text-danger-700" : "text-slate-400"}`}>
                    {p.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={pageSafe}
            totalPages={totalPages}
            onChange={setPage}
            summary={`Showing ${(pageSafe - 1) * PAGE_SIZE + 1}–${Math.min(pageSafe * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
          />
        </Card>
      )}
    </>
  );
}
