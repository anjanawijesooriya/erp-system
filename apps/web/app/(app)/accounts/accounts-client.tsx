"use client";

import { useMemo, useState } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Button } from "@erp/ui/button";
import { Sheet } from "@erp/ui/sheet";
import { PlusIcon, WalletIcon, SearchIcon } from "@/components/icons";
import { AccountForm } from "./account-form";

export interface AccountRow {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "income" | "expense";
  isSystemAccount: boolean;
  balance: number;
}

const SECTIONS: { type: AccountRow["type"]; label: string; headerClass: string }[] = [
  { type: "asset", label: "Assets", headerClass: "bg-brand-50 text-brand-700" },
  { type: "liability", label: "Liabilities", headerClass: "bg-danger-50 text-danger-700" },
  { type: "equity", label: "Equity", headerClass: "bg-success-50 text-success-700" },
  { type: "income", label: "Revenue", headerClass: "bg-warning-50 text-warning-700" },
  { type: "expense", label: "Expenses", headerClass: "bg-info-50 text-info-700" },
];

const TYPE_LABEL: Record<AccountRow["type"], string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  income: "Revenue",
  expense: "Expense",
};

export function AccountsClient({ accounts, canManage }: { accounts: AccountRow[]; canManage: boolean }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AccountRow["type"] | "">("");

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      if (typeFilter && a.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!a.name.toLowerCase().includes(q) && !a.code.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [accounts, search, typeFilter]);

  return (
    <>
      {canManage && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            Add account
          </Button>
        </div>
      )}

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[240px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by account name or code…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as AccountRow["type"] | "")}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="">All types</option>
          <option value="asset">Assets</option>
          <option value="liability">Liabilities</option>
          <option value="equity">Equity</option>
          <option value="income">Revenue</option>
          <option value="expense">Expenses</option>
        </select>
      </Card>

      {accounts.length === 0 ? (
        <Card>
          <EmptyState icon={<WalletIcon className="h-5 w-5" />} title="No accounts yet." description="Your chart of accounts will be seeded from your business type." />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<SearchIcon className="h-5 w-5" />} title="No matching accounts." description="Try a different search or filter." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[0.8fr_2fr_1fr_1fr] px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            <span>Code</span>
            <span>Account name</span>
            <span>Type</span>
            <span className="text-right">Balance (LKR)</span>
          </div>
          {SECTIONS.map((section) => {
            const rows = filtered.filter((a) => a.type === section.type);
            if (rows.length === 0) return null;
            return (
              <div key={section.type}>
                <div className={`px-5 py-2 text-[11px] font-bold uppercase tracking-wide ${section.headerClass}`}>{section.label}</div>
                {rows.map((a) => (
                  <div
                    key={a.id}
                    className="grid grid-cols-[0.8fr_2fr_1fr_1fr] items-center border-t border-slate-100 px-5 py-3 pl-8 text-sm transition-colors hover:bg-slate-50/70"
                  >
                    <span className="text-slate-500">{a.code}</span>
                    <span className="font-medium text-slate-900">
                      {a.name}
                      {a.isSystemAccount && <span className="ml-2 text-xs font-normal text-slate-400">(system)</span>}
                    </span>
                    <span className="text-slate-500">{TYPE_LABEL[a.type]}</span>
                    <span className="text-right font-medium text-slate-900">{a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </Card>
      )}

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New account"
        description="Extend your chart of accounts with a custom ledger account."
        icon={<WalletIcon className="h-4 w-4" />}
      >
        <AccountForm onDone={() => setCreateOpen(false)} />
      </Sheet>
    </>
  );
}
