"use client";

import { useState, useTransition } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Badge, toneForStatus } from "@erp/ui/badge";
import { Button } from "@erp/ui/button";
import { Sheet, DetailRow, DetailSection } from "@erp/ui/sheet";
import { ConfirmDialog } from "@erp/ui/dialog";
import { useToast } from "@erp/ui/toast";
import { PlusIcon, ReceiptIcon } from "@/components/icons";
import { SalesDocForm } from "@/components/sales-doc-form";
import { createQuotationAction, cancelQuotationAction } from "./actions";

interface Quotation {
  id: string;
  docNumber: string;
  status: string;
  quoteDate: string;
  validUntil: string | null;
  note: string | null;
  customer: { name: string } | null;
  lines: { productVariantId: string; qty: string; unitPrice: string }[];
}

export function QuotationsClient({
  quotations,
  branches,
  customers,
  variants,
  canCreate,
  canCancel,
}: {
  quotations: Quotation[];
  branches: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
  canCreate: boolean;
  canCancel: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Quotation | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const variantLabel = (id: string) => variants.find((v) => v.id === id)?.label ?? id;

  function handleCancel() {
    if (!selected) return;
    startTransition(async () => {
      const result = await cancelQuotationAction(selected.id);
      if (result?.error) {
        toast(result.error, "error");
      } else {
        toast("Quotation cancelled.", "success");
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
            New quotation
          </Button>
        </div>
      )}

      {quotations.length === 0 ? (
        <Card>
          <EmptyState icon={<ReceiptIcon className="h-5 w-5" />} title="No quotations yet." description="Create one once you have a customer and a product." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Doc #</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Quote date</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Lines</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr
                  key={q.id}
                  onClick={() => setSelected(q)}
                  className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-900">{q.docNumber}</td>
                  <td className="px-4 py-2.5 text-slate-600">{q.customer?.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{q.quoteDate}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={toneForStatus(q.status)}>{q.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{q.lines.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New quotation"
        description="Quote a customer before they order."
        icon={<ReceiptIcon className="h-4 w-4" />}
      >
        <SalesDocForm
          action={createQuotationAction}
          branches={branches}
          customers={customers}
          variants={variants}
          dateFieldName="quoteDate"
          dateLabel="Quote date"
          submitLabel="Create quotation"
          showValidUntil
        />
      </Sheet>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.docNumber ?? ""}
        description="Quotation details"
        icon={<ReceiptIcon className="h-4 w-4" />}
        width="md"
      >
        {selected && (
          <>
            <DetailSection title="Overview">
              <DetailRow label="Status" value={<Badge tone={toneForStatus(selected.status)}>{selected.status}</Badge>} />
              <DetailRow label="Customer" value={selected.customer?.name ?? "—"} />
              <DetailRow label="Quote date" value={selected.quoteDate} />
              <DetailRow label="Valid until" value={selected.validUntil ?? "—"} />
              {selected.note && <DetailRow label="Note" value={selected.note} />}
            </DetailSection>
            <DetailSection title="Line items">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Unit price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lines.map((l, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-1.5">{variantLabel(l.productVariantId)}</td>
                        <td className="px-3 py-1.5 text-right">{l.qty}</td>
                        <td className="px-3 py-1.5 text-right">{l.unitPrice}</td>
                        <td className="px-3 py-1.5 text-right font-medium">
                          {(Number(l.qty) * Number(l.unitPrice)).toLocaleString()}
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
                  Cancel quotation
                </Button>
              </div>
            )}
          </>
        )}
      </Sheet>

      <ConfirmDialog
        open={confirmingCancel}
        title="Cancel this quotation?"
        description="This can't be undone. Only possible while no sales order has been created from it."
        confirmLabel="Cancel quotation"
        variant="destructive"
        pending={pending}
        onConfirm={handleCancel}
        onCancel={() => setConfirmingCancel(false)}
      />
    </>
  );
}
