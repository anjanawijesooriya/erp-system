"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, EmptyState } from "@erp/ui/card";
import { Badge, toneForStatus } from "@erp/ui/badge";
import { Button } from "@erp/ui/button";
import { Sheet } from "@erp/ui/sheet";
import { PlusIcon, ReceiptIcon } from "@/components/icons";
import { SalesDocForm } from "@/components/sales-doc-form";
import { createSalesInvoiceAction } from "./actions";

interface Invoice {
  id: string;
  docNumber: string;
  dueDate: string;
  totalAmount: string;
  status: string;
  customer: { name: string } | null;
}

export function SalesInvoicesClient({
  invoices,
  branches,
  customers,
  variants,
  canCreate,
}: {
  invoices: Invoice[];
  branches: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  variants: { id: string; label: string }[];
  canCreate: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      {canCreate && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New sales invoice
          </Button>
        </div>
      )}

      {invoices.length === 0 ? (
        <Card>
          <EmptyState icon={<ReceiptIcon className="h-5 w-5" />} title="No sales invoices yet." description="Record one once you have a customer and a product." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Doc #</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Due date</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr
                  key={i.id}
                  onClick={() => router.push(`/sales/invoices/${i.id}`)}
                  className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-900">{i.docNumber}</td>
                  <td className="px-4 py-2.5 text-slate-600">{i.customer?.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{i.dueDate}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{Number(i.totalAmount).toLocaleString()}</td>
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
        title="New sales invoice"
        description="Bill a customer. Doesn't move stock — post a delivery separately."
        icon={<ReceiptIcon className="h-4 w-4" />}
      >
        <SalesDocForm
          action={createSalesInvoiceAction}
          branches={branches}
          customers={customers}
          variants={variants}
          dateFieldName="invoiceDate"
          dateLabel="Invoice date"
          submitLabel="Record invoice"
          helperText="Due date is calculated automatically from the customer's credit terms."
        />
      </Sheet>
    </>
  );
}
