"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, EmptyState } from "@erp/ui/card";
import { Badge, toneForStatus } from "@erp/ui/badge";
import { Button } from "@erp/ui/button";
import { Sheet } from "@erp/ui/sheet";
import { Pagination } from "@erp/ui/pagination";
import { PlusIcon, ReceiptIcon } from "@/components/icons";
import { SalesInvoiceForm } from "./invoice-form";

interface Invoice {
  id: string;
  docNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: string;
  status: string;
  customer: { name: string } | null;
  allocations: { amountApplied: string }[];
}

const PAGE_SIZE = 6;

export function SalesInvoicesClient({
  invoices,
  branches,
  customers,
  variants,
  canCreate,
}: {
  invoices: Invoice[];
  branches: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
  canCreate: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();

  const [customerFilter, setCustomerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [docSearch, setDocSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return invoices.filter((i) => {
      if (customerFilter && i.customer?.name !== customerFilter) return false;
      if (statusFilter && i.status !== statusFilter) return false;
      if (docSearch && !i.docNumber.toLowerCase().includes(docSearch.toLowerCase())) return false;
      if (dateFilter && i.invoiceDate !== dateFilter) return false;
      return true;
    });
  }, [invoices, customerFilter, statusFilter, docSearch, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const customerNames = Array.from(new Set(invoices.map((i) => i.customer?.name).filter((n): n is string => !!n)));
  const totalThisPage = filtered.reduce((sum, i) => sum + Number(i.totalAmount), 0);

  function resetFilters() {
    setCustomerFilter("");
    setStatusFilter("");
    setDocSearch("");
    setDateFilter("");
    setPage(1);
  }

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-3">
        <p className="text-sm text-slate-500">
          {invoices.length} invoice{invoices.length === 1 ? "" : "s"} · {totalThisPage.toLocaleString()} total shown
        </p>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New sales invoice
          </Button>
        )}
      </div>

      <Card className="mb-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Customer</label>
          <select
            value={customerFilter}
            onChange={(e) => {
              setCustomerFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All customers</option>
            {customerNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="partially_paid">Partial</option>
            <option value="unpaid">Unpaid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Invoice no.</label>
          <input
            value={docSearch}
            onChange={(e) => {
              setDocSearch(e.target.value);
              setPage(1);
            }}
            placeholder="INV-1015"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="h-[38px] rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<ReceiptIcon className="h-5 w-5" />} title="No sales invoices match these filters." description="Try resetting the filters, or record a new invoice." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Invoice</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5 text-right">Balance</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((i) => {
                const applied = i.allocations.reduce((sum, a) => sum + Number(a.amountApplied), 0);
                const balance = Number(i.totalAmount) - applied;
                return (
                  <tr
                    key={i.id}
                    onClick={() => router.push(`/sales/invoices/${i.id}`)}
                    className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-2.5 font-semibold text-brand-700">{i.docNumber}</td>
                    <td className="px-4 py-2.5 text-slate-600">{i.customer?.name}</td>
                    <td className="px-4 py-2.5 text-slate-500">{i.invoiceDate}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900">{Number(i.totalAmount).toLocaleString()}</td>
                    <td className={`px-4 py-2.5 text-right ${balance > 0.0001 ? "font-medium text-danger-700" : "text-slate-400"}`}>
                      {balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={toneForStatus(i.status)}>{i.status.replace("_", " ")}</Badge>
                    </td>
                  </tr>
                );
              })}
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

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New sales invoice"
        description="Bill a customer. Doesn't move stock — post a delivery separately."
        icon={<ReceiptIcon className="h-4 w-4" />}
      >
        <SalesInvoiceForm branches={branches} customers={customers} variants={variants} />
      </Sheet>
    </>
  );
}
