"use client";

import { useState } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Button } from "@erp/ui/button";
import { Sheet, DetailRow, DetailSection } from "@erp/ui/sheet";
import { PlusIcon, PackageIcon } from "@/components/icons";
import { GrnForm } from "./grn-form";

interface OutstandingPO {
  id: string;
  docNumber: string;
  supplierId: string;
  lines: { productVariantId: string; remainingQty: number; unitCost: number }[];
}

interface Grn {
  id: string;
  docNumber: string;
  receivedDate: string;
  note: string | null;
  supplier: { name: string } | null;
  warehouse: { name: string } | null;
  purchaseOrder: { docNumber: string } | null;
  lines: { productVariantId: string; receivedQty: string; unitCost: string; batchNumber: string | null; expiryDate: string | null }[];
}

export function GrnClient({
  grns,
  branches,
  warehouses,
  suppliers,
  variants,
  purchaseOrders,
  canCreate,
}: {
  grns: Grn[];
  branches: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  suppliers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
  purchaseOrders: OutstandingPO[];
  canCreate: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Grn | null>(null);

  const variantLabel = (id: string) => variants.find((v) => v.id === id)?.label ?? id;
  const hasBatchInfo = selected?.lines.some((l) => l.batchNumber || l.expiryDate) ?? false;

  return (
    <>
      {canCreate && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New GRN
          </Button>
        </div>
      )}

      {grns.length === 0 ? (
        <Card>
          <EmptyState icon={<PackageIcon className="h-5 w-5" />} title="No GRNs yet." description="Post one when stock arrives." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Doc #</th>
                <th className="px-4 py-2.5">Supplier</th>
                <th className="px-4 py-2.5">Warehouse</th>
                <th className="px-4 py-2.5">Linked PO</th>
                <th className="px-4 py-2.5">Received</th>
                <th className="px-4 py-2.5 text-right">Lines</th>
              </tr>
            </thead>
            <tbody>
              {grns.map((g) => (
                <tr
                  key={g.id}
                  onClick={() => setSelected(g)}
                  className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-900">{g.docNumber}</td>
                  <td className="px-4 py-2.5 text-slate-600">{g.supplier?.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{g.warehouse?.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{g.purchaseOrder?.docNumber ?? "—"}</td>
                  <td className="px-4 py-2.5 text-slate-600">{g.receivedDate}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{g.lines.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New GRN"
        description="Record stock as it arrives."
        icon={<PackageIcon className="h-4 w-4" />}
      >
        <GrnForm branches={branches} warehouses={warehouses} suppliers={suppliers} variants={variants} purchaseOrders={purchaseOrders} />
      </Sheet>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.docNumber ?? ""}
        description="GRN details"
        icon={<PackageIcon className="h-4 w-4" />}
        width="md"
      >
        {selected && (
          <>
            <DetailSection title="Overview">
              <DetailRow label="Supplier" value={selected.supplier?.name ?? "—"} />
              <DetailRow label="Warehouse" value={selected.warehouse?.name ?? "—"} />
              <DetailRow label="Linked PO" value={selected.purchaseOrder?.docNumber ?? "— received directly —"} />
              <DetailRow label="Received date" value={selected.receivedDate} />
              {selected.note && <DetailRow label="Note" value={selected.note} />}
            </DetailSection>
            <DetailSection title="Line items">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Unit cost</th>
                      {hasBatchInfo && <th className="px-3 py-2">Batch</th>}
                      {hasBatchInfo && <th className="px-3 py-2">Expiry</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lines.map((l, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-1.5">{variantLabel(l.productVariantId)}</td>
                        <td className="px-3 py-1.5 text-right">{l.receivedQty}</td>
                        <td className="px-3 py-1.5 text-right">{l.unitCost}</td>
                        {hasBatchInfo && <td className="px-3 py-1.5">{l.batchNumber ?? "—"}</td>}
                        {hasBatchInfo && <td className="px-3 py-1.5">{l.expiryDate ?? "—"}</td>}
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
