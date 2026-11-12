"use client";

import { useState, useTransition } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Badge, toneForStatus } from "@erp/ui/badge";
import { Button } from "@erp/ui/button";
import { Sheet, DetailRow, DetailSection } from "@erp/ui/sheet";
import { ConfirmDialog } from "@erp/ui/dialog";
import { useToast } from "@erp/ui/toast";
import { PlusIcon, ReceiptIcon } from "@/components/icons";
import { SupplierInvoiceForm } from "./invoice-form";
import { cancelSupplierInvoiceAction } from "./actions";

interface UninvoicedGrn {
  id: string;
  docNumber: string;
  supplierId: string;
  lines: { productVariantId: string; quantity: number; unitCost: number }[];
}

interface Invoice {
  id: string;
  docNumber: string;
  supplierRefNumber: string | null;
  invoiceDate: string;
  dueDate: string;
  totalAmount: string;
  status: string;
  note: string | null;
  supplier: { name: string } | null;
  grn: { docNumber: string } | null;
  lines: { productVariantId: string; qty: string; unitCost: string; lineTotal: string }[];
}

export function SupplierInvoicesClient({
  invoices,
  branches,
  suppliers,
  variants,
  grns,
  canCreate,
  canCancel,
}: {
  invoices: Invoice[];
  branches: { id: string; name: string }[];
  suppliers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
  grns: UninvoicedGrn[];
  canCreate: boolean;
  canCancel: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const variantLabel = (id: string) => variants.find((v) => v.id === id)?.label ?? id;

  function handleCancel() {
    if (!selected) return;
    startTransition(async () => {
      const result = await cancelSupplierInvoiceAction(selected.id);
      if (result?.error) {
        toast(result.error, "error");
      } else {
        toast("Supplier invoice cancelled.", "success");
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
            New supplier invoice
          </Button>
        </div>
      )}

      {invoices.length === 0 ? (
        <Card>
          <EmptyState icon={<ReceiptIcon className="h-5 w-5" />} title="No supplier invoices yet." description="Record one when a bill comes in." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Doc #</th>
                <th className="px-4 py-2.5">Supplier</th>
                <th className="px-4 py-2.5">Linked GRN</th>
                <th className="px-4 py-2.5">Due date</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr
                  key={i.id}
                  onClick={() => setSelected(i)}
                  className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-900">{i.docNumber}</td>
                  <td className="px-4 py-2.5 text-slate-600">{i.supplier?.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{i.grn?.docNumber ?? "—"}</td>
                  <td className="px-4 py-2.5 text-slate-600">{i.dueDate}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{i.totalAmount}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={toneForStatus(i.status)}>{i.status.replace("_", " ")}</Badge>
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
        title="New supplier invoice"
        description="Record a bill owed to a supplier."
        icon={<ReceiptIcon className="h-4 w-4" />}
      >
        <SupplierInvoiceForm branches={branches} suppliers={suppliers} variants={variants} grns={grns} />
      </Sheet>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.docNumber ?? ""}
        description="Supplier invoice details"
        icon={<ReceiptIcon className="h-4 w-4" />}
        width="md"
      >
        {selected && (
          <>
            <DetailSection title="Overview">
              <DetailRow label="Status" value={<Badge tone={toneForStatus(selected.status)}>{selected.status.replace("_", " ")}</Badge>} />
              <DetailRow label="Supplier" value={selected.supplier?.name ?? "—"} />
              <DetailRow label="Linked GRN" value={selected.grn?.docNumber ?? "—"} />
              <DetailRow label="Supplier ref #" value={selected.supplierRefNumber ?? "—"} />
              <DetailRow label="Invoice date" value={selected.invoiceDate} />
              <DetailRow label="Due date" value={selected.dueDate} />
              <DetailRow label="Total" value={selected.totalAmount} />
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
                        <td className="px-3 py-1.5 text-right">{l.qty}</td>
                        <td className="px-3 py-1.5 text-right">{l.unitCost}</td>
                        <td className="px-3 py-1.5 text-right font-medium">{l.lineTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DetailSection>
            {canCancel && selected.status === "unpaid" && (
              <div className="px-5 py-4">
                <Button variant="destructive" onClick={() => setConfirmingCancel(true)}>
                  Cancel invoice
                </Button>
              </div>
            )}
          </>
        )}
      </Sheet>

      <ConfirmDialog
        open={confirmingCancel}
        title="Cancel this invoice?"
        description="This can't be undone. Only possible while it's still fully unpaid."
        confirmLabel="Cancel invoice"
        variant="destructive"
        pending={pending}
        onConfirm={handleCancel}
        onCancel={() => setConfirmingCancel(false)}
      />
    </>
  );
}
