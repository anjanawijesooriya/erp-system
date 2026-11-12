"use client";

import { useState } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Badge, toneForStatus } from "@erp/ui/badge";
import { Button } from "@erp/ui/button";
import { Sheet, DetailRow, DetailSection } from "@erp/ui/sheet";
import { PlusIcon, ClipboardIcon } from "@/components/icons";
import { StockCountForm } from "./stock-count-form";

interface StockCount {
  id: string;
  createdAt: string | Date;
  status: string;
  note: string | null;
  warehouse: { name: string } | null;
  lines: {
    id: string;
    systemQuantity: string;
    countedQuantity: string;
    productVariant: { sku: string; name: string } | null;
  }[];
}

export function StockCountsClient({
  counts,
  warehouses,
  variants,
  canCreate,
}: {
  counts: StockCount[];
  warehouses: { id: string; name: string }[];
  variants: { id: string; label: string }[];
  canCreate: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<StockCount | null>(null);

  return (
    <>
      {canCreate && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New stock count
          </Button>
        </div>
      )}

      {counts.length === 0 ? (
        <Card>
          <EmptyState icon={<ClipboardIcon className="h-5 w-5" />} title="No stock counts yet." description="Submit one to reconcile physical stock against the system." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Warehouse</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Lines</th>
              </tr>
            </thead>
            <tbody>
              {counts.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-4 py-2.5 text-slate-600">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{c.warehouse?.name}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={toneForStatus(c.status)}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{c.lines.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New stock count"
        description="Reconcile physical stock against the system."
        icon={<ClipboardIcon className="h-4 w-4" />}
      >
        <StockCountForm warehouses={warehouses} variants={variants} />
      </Sheet>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Stock count details"
        description={selected ? new Date(selected.createdAt).toLocaleString() : undefined}
        icon={<ClipboardIcon className="h-4 w-4" />}
        width="md"
      >
        {selected && (
          <>
            <DetailSection title="Overview">
              <DetailRow label="Status" value={<Badge tone={toneForStatus(selected.status)}>{selected.status}</Badge>} />
              <DetailRow label="Warehouse" value={selected.warehouse?.name ?? "—"} />
              {selected.note && <DetailRow label="Note" value={selected.note} />}
            </DetailSection>
            <DetailSection title="Line items">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">System qty</th>
                      <th className="px-3 py-2 text-right">Counted qty</th>
                      <th className="px-3 py-2 text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lines.map((l) => {
                      const variance = Number(l.countedQuantity) - Number(l.systemQuantity);
                      return (
                        <tr key={l.id} className="border-t border-slate-100">
                          <td className="px-3 py-1.5">{l.productVariant?.sku}</td>
                          <td className="px-3 py-1.5 text-right">{l.systemQuantity}</td>
                          <td className="px-3 py-1.5 text-right">{l.countedQuantity}</td>
                          <td className={`px-3 py-1.5 text-right font-medium ${variance !== 0 ? "text-amber-600" : "text-slate-400"}`}>
                            {variance > 0 ? "+" : ""}
                            {variance}
                          </td>
                        </tr>
                      );
                    })}
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
