"use client";

import { useMemo, useState } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Badge } from "@erp/ui/badge";
import { Button } from "@erp/ui/button";
import { Pagination } from "@erp/ui/pagination";
import { Sheet } from "@erp/ui/sheet";
import { PlusIcon, PackageIcon, SearchIcon } from "@/components/icons";
import { ImportForm } from "@/components/import-form";
import { ProductForm } from "./product-form";
import { importProductsAction } from "./actions";

export interface ProductRow {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  tracksBatches: boolean;
  isActive: boolean;
  costPrice: string;
  sellingPrice: string;
  barcode: string | null;
}

const PAGE_SIZE = 8;

export function ProductsClient({
  products,
  canSeeCost,
  canManage,
}: {
  products: ProductRow[];
  canSeeCost: boolean;
  canManage: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active">("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (activeFilter === "active" && !p.isActive) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.sku.toLowerCase().includes(q) &&
          !(p.barcode ?? "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [products, search, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  function updateFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  function marginFor(p: ProductRow) {
    const cost = Number(p.costPrice);
    const price = Number(p.sellingPrice);
    if (cost <= 0 || price <= 0) return null;
    return ((price - cost) / price) * 100;
  }

  return (
    <>
      {canManage && (
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex justify-end">
            <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
              <PlusIcon className="h-4 w-4" />
              Add product
            </Button>
          </div>
          <ImportForm
            action={importProductsAction}
            columnsHint="sku, name, description, baseUomCode, costPrice, sellingPrice, barcode, tracksBatches"
          />
        </div>
      )}

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[240px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => updateFilter(() => setSearch(e.target.value))}
            placeholder="Search by name, SKU or barcode…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <select
          value={activeFilter}
          onChange={(e) => updateFilter(() => setActiveFilter(e.target.value as "all" | "active"))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="all">Active &amp; inactive</option>
          <option value="active">Active only</option>
        </select>
      </Card>

      {products.length === 0 ? (
        <Card>
          <EmptyState icon={<PackageIcon className="h-5 w-5" />} title="No products yet." description="Add one to start selling." />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<SearchIcon className="h-5 w-5" />} title="No matching products." description="Try a different search or filter." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Product</th>
                {canSeeCost && <th className="px-4 py-2.5 text-right">Cost</th>}
                <th className="px-4 py-2.5 text-right">Price</th>
                {canSeeCost && <th className="px-4 py-2.5 text-right">Margin</th>}
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((p) => {
                const margin = marginFor(p);
                return (
                  <tr
                    key={p.id}
                    onClick={() => canManage && setEditing(p)}
                    className={`border-t border-slate-100 transition-colors hover:bg-slate-50/70 ${canManage ? "cursor-pointer" : ""}`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="h-9 w-9 flex-shrink-0 rounded-lg bg-slate-100" />
                        <div>
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-400">{p.sku}</div>
                        </div>
                      </div>
                    </td>
                    {canSeeCost && (
                      <td className="px-4 py-2.5 text-right text-slate-600">{Number(p.costPrice) > 0 ? Number(p.costPrice).toLocaleString() : "—"}</td>
                    )}
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900">{Number(p.sellingPrice).toLocaleString()}</td>
                    {canSeeCost && (
                      <td className={`px-4 py-2.5 text-right font-medium ${margin === null ? "text-slate-400" : "text-success-700"}`}>
                        {margin === null ? "—" : `${margin.toFixed(1)}%`}
                      </td>
                    )}
                    <td className="px-4 py-2.5">
                      <Badge tone={p.isActive ? "accent" : "slate"}>{p.isActive ? "Active" : "Inactive"}</Badge>
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
        title="New product"
        description="Define a product or service once — used across invoices, POS and purchase orders."
        icon={<PackageIcon className="h-4 w-4" />}
      >
        <ProductForm mode="create" onDone={() => setCreateOpen(false)} />
      </Sheet>

      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.name ?? ""}
        description="Edit product details and pricing."
        icon={<PackageIcon className="h-4 w-4" />}
      >
        {editing && <ProductForm mode="edit" product={editing} onDone={() => setEditing(null)} />}
      </Sheet>
    </>
  );
}
