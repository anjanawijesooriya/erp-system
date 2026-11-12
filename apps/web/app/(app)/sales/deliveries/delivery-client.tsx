"use client";

import { useState } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Button } from "@erp/ui/button";
import { Sheet, DetailRow, DetailSection } from "@erp/ui/sheet";
import { PlusIcon, TruckIcon } from "@/components/icons";
import { DeliveryForm } from "./delivery-form";

interface Delivery {
  id: string;
  docNumber: string;
  deliveryDate: string;
  note: string | null;
  customer: { name: string } | null;
  warehouse: { name: string } | null;
  lines: { productVariantId: string; qty: string; batchNumber: string | null }[];
}

export function DeliveriesClient({
  deliveries,
  branches,
  warehouses,
  customers,
  variants,
  canCreate,
}: {
  deliveries: Delivery[];
  branches: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
  canCreate: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Delivery | null>(null);

  const variantLabel = (id: string) => variants.find((v) => v.id === id)?.label ?? id;
  const hasBatchInfo = selected?.lines.some((l) => l.batchNumber) ?? false;

  return (
    <>
      {canCreate && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New delivery
          </Button>
        </div>
      )}

      {deliveries.length === 0 ? (
        <Card>
          <EmptyState icon={<TruckIcon className="h-5 w-5" />} title="No deliveries yet." description="Post one when goods physically go out." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Doc #</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Warehouse</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Lines</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-900">{d.docNumber}</td>
                  <td className="px-4 py-2.5 text-slate-600">{d.customer?.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{d.warehouse?.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{d.deliveryDate}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{d.lines.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New delivery"
        description="Ship goods out of a warehouse."
        icon={<TruckIcon className="h-4 w-4" />}
      >
        <DeliveryForm branches={branches} warehouses={warehouses} customers={customers} variants={variants} />
      </Sheet>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.docNumber ?? ""}
        description="Delivery details"
        icon={<TruckIcon className="h-4 w-4" />}
        width="md"
      >
        {selected && (
          <>
            <DetailSection title="Overview">
              <DetailRow label="Customer" value={selected.customer?.name ?? "—"} />
              <DetailRow label="Warehouse" value={selected.warehouse?.name ?? "—"} />
              <DetailRow label="Delivery date" value={selected.deliveryDate} />
              {selected.note && <DetailRow label="Note" value={selected.note} />}
            </DetailSection>
            <DetailSection title="Line items">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      {hasBatchInfo && <th className="px-3 py-2">Batch</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lines.map((l, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-1.5">{variantLabel(l.productVariantId)}</td>
                        <td className="px-3 py-1.5 text-right">{l.qty}</td>
                        {hasBatchInfo && <td className="px-3 py-1.5">{l.batchNumber ?? "—"}</td>}
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
