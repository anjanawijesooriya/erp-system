"use client";

import { useMemo, useState } from "react";
import { Card, EmptyState, StatTile } from "@erp/ui/card";
import { Pagination } from "@erp/ui/pagination";
import { PackageIcon, SearchIcon } from "@/components/icons";

interface StockRow {
  warehouseId: string;
  warehouseName: string;
  productVariantId: string;
  sku: string;
  productName: string;
  quantity: string;
  averageCost: string;
  sellingPrice: string;
}

const PAGE_SIZE = 8;

function downloadCsv(rows: StockRow[]) {
  const header = ["Code", "Description", "Warehouse", "Cost", "Rate", "In stock"];
  const lines = rows.map((r) =>
    [r.sku, r.productName, r.warehouseName, Number(r.averageCost).toFixed(2), Number(r.sellingPrice).toFixed(2), r.quantity].join(","),
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `stock-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function InventoryClient({
  stock,
  warehouses,
  lowStockKeys,
}: {
  stock: StockRow[];
  warehouses: { id: string; name: string }[];
  lowStockKeys: Set<string>;
}) {
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return stock.filter((r) => {
      if (warehouseFilter && r.warehouseId !== warehouseFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.sku.toLowerCase().includes(q) && !r.productName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [stock, warehouseFilter, search]);

  const totalItems = new Set(stock.map((r) => r.productVariantId)).size;
  const totalQuantity = stock.reduce((sum, r) => sum + Number(r.quantity), 0);
  const valuationCost = stock.reduce((sum, r) => sum + Number(r.quantity) * Number(r.averageCost), 0);
  const valuationRetail = stock.reduce((sum, r) => sum + Number(r.quantity) * Number(r.sellingPrice), 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <StatTile label="Total items" value={totalItems} />
        <StatTile label="Stock in hand" value={totalQuantity.toLocaleString()} />
        <StatTile label="Valuation (cost)" value={valuationCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
        <StatTile label="Valuation (retail)" value={valuationRetail.toLocaleString(undefined, { maximumFractionDigits: 0 })} tone="accent" />
      </div>

      <Card className="mb-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Warehouse</label>
          <select
            value={warehouseFilter}
            onChange={(e) => {
              setWarehouseFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Product name / code</label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or code…"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm"
            />
          </div>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => downloadCsv(filtered)}
            className="h-[38px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<PackageIcon className="h-5 w-5" />} title="No stock matches these filters." description="Try a different search or warehouse." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5">Warehouse</th>
                <th className="px-4 py-2.5 text-right">Cost</th>
                <th className="px-4 py-2.5 text-right">Rate</th>
                <th className="px-4 py-2.5 text-right">In stock</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const isLow = lowStockKeys.has(`${row.warehouseId}:${row.productVariantId}`);
                return (
                  <tr key={`${row.warehouseId}-${row.productVariantId}`} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-semibold text-brand-700">{row.sku}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{row.productName}</td>
                    <td className="px-4 py-2.5 text-slate-500">{row.warehouseName}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{Number(row.averageCost).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{Number(row.sellingPrice).toFixed(2)}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${isLow ? "text-danger-700" : "text-slate-700"}`}>
                      {Number(row.quantity).toFixed(2)}
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
    </>
  );
}
