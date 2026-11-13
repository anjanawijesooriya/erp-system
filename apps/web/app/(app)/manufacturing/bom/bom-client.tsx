"use client";

import { useState } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Badge } from "@erp/ui/badge";
import { Button } from "@erp/ui/button";
import { Sheet, DetailRow, DetailSection } from "@erp/ui/sheet";
import { PlusIcon, PackageIcon, SearchIcon } from "@/components/icons";
import { BomForm } from "./bom-form";
import { DeactivateBomButton } from "./deactivate-button";

interface Variant {
  id: string;
  label: string;
  costPrice: number;
}

interface BomRow {
  id: string;
  name: string;
  outputVariantName: string;
  outputQuantity: string;
  costPerUnit: number;
  lines: { id: string; quantity: string; unitCost: number; componentName: string; componentSku: string }[];
}

export function BomClient({ boms, variants, canManage }: { boms: BomRow[]; variants: Variant[]; canManage: boolean }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<BomRow | null>(null);
  const [search, setSearch] = useState("");

  const filtered = boms.filter((b) => !search || b.outputVariantName.toLowerCase().includes(search.toLowerCase()) || b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      {canManage && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New BOM
          </Button>
        </div>
      )}

      <Card className="mb-4 flex items-center gap-3 p-4">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by finished product…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
      </Card>

      {boms.length === 0 ? (
        <Card>
          <EmptyState icon={<PackageIcon className="h-5 w-5" />} title="No BOMs yet." description="Define the recipe for a manufactured product." />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<SearchIcon className="h-5 w-5" />} title="No matching BOMs." description="Try a different search." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Finished product</th>
                <th className="px-4 py-2.5">Components</th>
                <th className="px-4 py-2.5 text-right">Cost per unit</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} onClick={() => setSelected(b)} className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-9 flex-shrink-0 rounded-lg bg-slate-100" />
                      <div>
                        <div className="font-semibold text-slate-900">{b.name}</div>
                        <div className="text-xs text-slate-400">→ {b.outputQuantity} × {b.outputVariantName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{b.lines.length} item{b.lines.length === 1 ? "" : "s"}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-900">{b.costPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone="accent">Active</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    {canManage && <DeactivateBomButton bomId={b.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New BOM"
        description="Define the components and quantities needed to build one unit."
        icon={<PackageIcon className="h-4 w-4" />}
      >
        <BomForm variants={variants} onDone={() => setCreateOpen(false)} />
      </Sheet>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        description="BOM details"
        icon={<PackageIcon className="h-4 w-4" />}
        width="md"
      >
        {selected && (
          <>
            <DetailSection title="Overview">
              <DetailRow label="Finished product" value={selected.outputVariantName} />
              <DetailRow label="Output quantity per batch" value={selected.outputQuantity} />
              <DetailRow label="Cost per unit" value={selected.costPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })} />
            </DetailSection>
            <DetailSection title="Components">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Component</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Unit cost</th>
                      <th className="px-3 py-2 text-right">Line cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lines.map((l) => (
                      <tr key={l.id} className="border-t border-slate-100">
                        <td className="px-3 py-1.5">
                          {l.componentName}
                          <div className="text-xs text-slate-400">{l.componentSku}</div>
                        </td>
                        <td className="px-3 py-1.5 text-right">{l.quantity}</td>
                        <td className="px-3 py-1.5 text-right">{l.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-1.5 text-right font-medium">{(l.unitCost * Number(l.quantity)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DetailSection>
          </>
        )}
      </Sheet>
    </>
  );
}
