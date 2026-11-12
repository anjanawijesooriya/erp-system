"use client";

import { useState } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Badge } from "@erp/ui/badge";
import { Button } from "@erp/ui/button";
import { Sheet, DetailRow, DetailSection } from "@erp/ui/sheet";
import { PlusIcon, AlertTriangleIcon } from "@/components/icons";
import { AdjustmentForm } from "./adjustment-form";

interface Adjustment {
  id: string;
  createdAt: string | Date;
  reason: string;
  note: string | null;
  warehouse: { name: string } | null;
  lines: { productVariantId: string; quantityDelta: string; unitCost: string; batchNumber: string | null }[];
}

export function AdjustmentsClient({
  adjustments,
  warehouses,
  variants,
  canCreate,
}: {
  adjustments: Adjustment[];
  warehouses: { id: string; name: string }[];
  variants: { id: string; label: string }[];
  canCreate: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Adjustment | null>(null);

  const variantLabel = (id: string) => variants.find((v) => v.id === id)?.label ?? id;

  return (
    <>
      {canCreate && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New adjustment
          </Button>
        </div>
      )}

      {adjustments.length === 0 ? (
        <Card>
          <EmptyState icon={<AlertTriangleIcon className="h-5 w-5" />} title="No adjustments yet." description="Correct stock for damage, loss, expiry, or a count error." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Warehouse</th>
                <th className="px-4 py-2.5">Reason</th>
                <th className="px-4 py-2.5">Note</th>
                <th className="px-4 py-2.5 text-right">Lines</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-4 py-2.5 text-slate-600">{new Date(a.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{a.warehouse?.name}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone="amber">{a.reason.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{a.note ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{a.lines.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New adjustment"
        description="Correct stock for damage, loss, expiry, or an error."
        icon={<AlertTriangleIcon className="h-4 w-4" />}
      >
        <AdjustmentForm warehouses={warehouses} variants={variants} />
      </Sheet>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Adjustment details"
        description={selected ? new Date(selected.createdAt).toLocaleString() : undefined}
        icon={<AlertTriangleIcon className="h-4 w-4" />}
        width="md"
      >
        {selected && (
          <>
            <DetailSection title="Overview">
              <DetailRow label="Warehouse" value={selected.warehouse?.name ?? "—"} />
              <DetailRow label="Reason" value={<Badge tone="amber">{selected.reason.replace("_", " ")}</Badge>} />
              {selected.note && <DetailRow label="Note" value={selected.note} />}
            </DetailSection>
            <DetailSection title="Line items">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">Qty change</th>
                      <th className="px-3 py-2 text-right">Unit cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lines.map((l, i) => {
                      const delta = Number(l.quantityDelta);
                      return (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-3 py-1.5">{variantLabel(l.productVariantId)}</td>
                          <td className={`px-3 py-1.5 text-right font-medium ${delta >= 0 ? "text-accent-700" : "text-rose-700"}`}>
                            {delta > 0 ? "+" : ""}
                            {l.quantityDelta}
                          </td>
                          <td className="px-3 py-1.5 text-right">{l.unitCost}</td>
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
