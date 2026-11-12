"use client";

import { useState, useTransition } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Badge, toneForStatus } from "@erp/ui/badge";
import { Button } from "@erp/ui/button";
import { Sheet, DetailRow, DetailSection } from "@erp/ui/sheet";
import { ConfirmDialog } from "@erp/ui/dialog";
import { useToast } from "@erp/ui/toast";
import { PlusIcon, ReceiptIcon } from "@/components/icons";
import { PurchaseOrderForm } from "./po-form";
import { cancelPurchaseOrderAction } from "./actions";

interface Order {
  id: string;
  docNumber: string;
  status: string;
  orderDate: string;
  expectedDate: string | null;
  note: string | null;
  supplier: { name: string } | null;
  lines: { productVariantId: string; orderedQty: string; unitCost: string }[];
}

export function PurchaseOrdersClient({
  orders,
  branches,
  suppliers,
  variants,
  canCreate,
  canCancel,
}: {
  orders: Order[];
  branches: { id: string; name: string }[];
  suppliers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
  canCreate: boolean;
  canCancel: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const variantLabel = (id: string) => variants.find((v) => v.id === id)?.label ?? id;

  function handleCancel() {
    if (!selected) return;
    startTransition(async () => {
      const result = await cancelPurchaseOrderAction(selected.id);
      if (result?.error) {
        toast(result.error, "error");
      } else {
        toast("Purchase order cancelled.", "success");
        setConfirmingCancel(false);
        setSelected(null);
      }
    });
  }

  return (
    <>
      {canCreate && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New purchase order
          </Button>
        </div>
      )}

      {orders.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ReceiptIcon className="h-5 w-5" />}
            title="No purchase orders yet."
            description="Create one once you have a supplier and at least one product."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Doc #</th>
                <th className="px-4 py-2.5">Supplier</th>
                <th className="px-4 py-2.5">Order date</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Lines</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-900">{o.docNumber}</td>
                  <td className="px-4 py-2.5 text-slate-600">{o.supplier?.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{o.orderDate}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={toneForStatus(o.status)}>{o.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{o.lines.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New purchase order"
        description="Request stock from a supplier."
        icon={<ReceiptIcon className="h-4 w-4" />}
      >
        <PurchaseOrderForm branches={branches} suppliers={suppliers} variants={variants} />
      </Sheet>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.docNumber ?? ""}
        description="Purchase order details"
        icon={<ReceiptIcon className="h-4 w-4" />}
        width="md"
      >
        {selected && (
          <>
            <DetailSection title="Overview">
              <DetailRow label="Status" value={<Badge tone={toneForStatus(selected.status)}>{selected.status}</Badge>} />
              <DetailRow label="Supplier" value={selected.supplier?.name ?? "—"} />
              <DetailRow label="Order date" value={selected.orderDate} />
              <DetailRow label="Expected date" value={selected.expectedDate ?? "—"} />
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
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lines.map((l, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-1.5">{variantLabel(l.productVariantId)}</td>
                        <td className="px-3 py-1.5 text-right">{l.orderedQty}</td>
                        <td className="px-3 py-1.5 text-right">{l.unitCost}</td>
                        <td className="px-3 py-1.5 text-right font-medium">
                          {(Number(l.orderedQty) * Number(l.unitCost)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DetailSection>
            {canCancel && selected.status === "open" && (
              <div className="px-5 py-4">
                <Button variant="destructive" onClick={() => setConfirmingCancel(true)}>
                  Cancel purchase order
                </Button>
              </div>
            )}
          </>
        )}
      </Sheet>

      <ConfirmDialog
        open={confirmingCancel}
        title="Cancel this purchase order?"
        description="This can't be undone. Only possible while nothing has been received against it yet."
        confirmLabel="Cancel order"
        variant="destructive"
        pending={pending}
        onConfirm={handleCancel}
        onCancel={() => setConfirmingCancel(false)}
      />
    </>
  );
}
