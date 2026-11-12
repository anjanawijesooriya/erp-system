"use client";

import { useState } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Badge, toneForStatus } from "@erp/ui/badge";
import { Button } from "@erp/ui/button";
import { Sheet, DetailRow, DetailSection } from "@erp/ui/sheet";
import { PlusIcon, SwapIcon } from "@/components/icons";
import { TransferForm } from "./transfer-form";

interface Transfer {
  id: string;
  createdAt: string | Date;
  status: string;
  note: string | null;
  fromWarehouse: { name: string } | null;
  toWarehouse: { name: string } | null;
  lines: { productVariantId: string; quantity: string; batchNumber: string | null }[];
}

interface StockRow {
  warehouseId: string;
  productVariantId: string;
  quantity: number;
}

export function TransfersClient({
  transfers,
  warehouses,
  variants,
  stock,
  canCreate,
}: {
  transfers: Transfer[];
  warehouses: { id: string; name: string }[];
  variants: { id: string; label: string }[];
  stock: StockRow[];
  canCreate: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Transfer | null>(null);

  const variantLabel = (id: string) => variants.find((v) => v.id === id)?.label ?? id;

  return (
    <>
      {canCreate && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New transfer
          </Button>
        </div>
      )}

      {transfers.length === 0 ? (
        <Card>
          <EmptyState icon={<SwapIcon className="h-5 w-5" />} title="No transfers yet." description="Move stock between warehouses." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">From</th>
                <th className="px-4 py-2.5">To</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Lines</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-4 py-2.5 text-slate-600">{new Date(t.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{t.fromWarehouse?.name}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{t.toWarehouse?.name}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={toneForStatus(t.status)}>{t.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{t.lines.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New transfer"
        description="Move stock between warehouses."
        icon={<SwapIcon className="h-4 w-4" />}
      >
        <TransferForm warehouses={warehouses} variants={variants} stock={stock} />
      </Sheet>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Transfer details"
        description={selected ? new Date(selected.createdAt).toLocaleString() : undefined}
        icon={<SwapIcon className="h-4 w-4" />}
        width="md"
      >
        {selected && (
          <>
            <DetailSection title="Overview">
              <DetailRow label="Status" value={<Badge tone={toneForStatus(selected.status)}>{selected.status}</Badge>} />
              <DetailRow label="From warehouse" value={selected.fromWarehouse?.name ?? "—"} />
              <DetailRow label="To warehouse" value={selected.toWarehouse?.name ?? "—"} />
              {selected.note && <DetailRow label="Note" value={selected.note} />}
            </DetailSection>
            <DetailSection title="Line items">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2">Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lines.map((l, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-1.5">{variantLabel(l.productVariantId)}</td>
                        <td className="px-3 py-1.5 text-right">{l.quantity}</td>
                        <td className="px-3 py-1.5">{l.batchNumber ?? "—"}</td>
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
