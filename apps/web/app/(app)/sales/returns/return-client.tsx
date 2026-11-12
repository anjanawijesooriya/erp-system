"use client";

import { useState } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Badge } from "@erp/ui/badge";
import { Button } from "@erp/ui/button";
import { Sheet, DetailRow, DetailSection } from "@erp/ui/sheet";
import { PlusIcon, UndoIcon } from "@/components/icons";
import { SalesReturnForm } from "./return-form";

interface SalesReturn {
  id: string;
  docNumber: string;
  returnDate: string;
  reason: string;
  note: string | null;
  customer: { name: string } | null;
  warehouse: { name: string } | null;
  invoice: { docNumber: string } | null;
  lines: { productVariantId: string; qty: string; unitPrice: string }[];
}

interface InvoiceOption {
  id: string;
  docNumber: string;
  customerId: string;
  lines: { productVariantId: string; qty: number; unitPrice: number }[];
}

export function SalesReturnsClient({
  returns,
  branches,
  warehouses,
  customers,
  variants,
  invoices,
  canCreate,
}: {
  returns: SalesReturn[];
  branches: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
  invoices: InvoiceOption[];
  canCreate: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<SalesReturn | null>(null);

  const variantLabel = (id: string) => variants.find((v) => v.id === id)?.label ?? id;

  return (
    <>
      {canCreate && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New sales return
          </Button>
        </div>
      )}

      {returns.length === 0 ? (
        <Card>
          <EmptyState icon={<UndoIcon className="h-5 w-5" />} title="No sales returns yet." description="Post one when a customer sends stock back." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Doc #</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Warehouse</th>
                <th className="px-4 py-2.5">Reason</th>
                <th className="px-4 py-2.5 text-right">Lines</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-900">{r.docNumber}</td>
                  <td className="px-4 py-2.5 text-slate-600">{r.customer?.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{r.warehouse?.name}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone="amber">{r.reason.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{r.lines.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New sales return"
        description="Take stock back from a customer."
        icon={<UndoIcon className="h-4 w-4" />}
      >
        <SalesReturnForm branches={branches} warehouses={warehouses} customers={customers} variants={variants} invoices={invoices} />
      </Sheet>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.docNumber ?? ""}
        description="Sales return details"
        icon={<UndoIcon className="h-4 w-4" />}
        width="md"
      >
        {selected && (
          <>
            <DetailSection title="Overview">
              <DetailRow label="Customer" value={selected.customer?.name ?? "—"} />
              <DetailRow label="Warehouse" value={selected.warehouse?.name ?? "—"} />
              <DetailRow label="Original invoice" value={selected.invoice?.docNumber ?? "— returned directly —"} />
              <DetailRow label="Return date" value={selected.returnDate} />
              <DetailRow label="Reason" value={<Badge tone="amber">{selected.reason.replace(/_/g, " ")}</Badge>} />
              {selected.note && <DetailRow label="Note" value={selected.note} />}
            </DetailSection>
            <DetailSection title="Line items">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Credit value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lines.map((l, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-1.5">{variantLabel(l.productVariantId)}</td>
                        <td className="px-3 py-1.5 text-right">{l.qty}</td>
                        <td className="px-3 py-1.5 text-right">{l.unitPrice}</td>
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
