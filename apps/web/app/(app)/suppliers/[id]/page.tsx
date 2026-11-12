import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { db } from "@erp/db";
import { suppliers } from "@erp/db/schema";
import { listPurchaseOrders, listGrns, listSupplierPayments, listPurchaseReturns, listPayablesAging } from "@erp/core/purchasing";
import { requireSession } from "@/lib/session";
import { Badge } from "@erp/ui/badge";
import { ClipboardIcon } from "@/components/icons";
import { SupplierDetailClient } from "./supplier-detail-client";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await requireSession();

  const [supplier, allOrders, allGrns, allPayments, allReturns, payableRows] = await Promise.all([
    db.query.suppliers.findFirst({ where: and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)) }),
    listPurchaseOrders(tenantId),
    listGrns(tenantId),
    listSupplierPayments(tenantId),
    listPurchaseReturns(tenantId),
    listPayablesAging(tenantId),
  ]);
  if (!supplier) notFound();

  const itemsSummary = (lines: { productVariant: { name: string } | null; qty?: string; orderedQty?: string; receivedQty?: string }[]) =>
    lines
      .map((l) => `${l.productVariant?.name ?? "Item"} ×${l.qty ?? l.orderedQty ?? l.receivedQty ?? 0}`)
      .join(", ");

  const orders = allOrders
    .filter((o) => o.supplierId === supplier.id)
    .map((o) => ({
      id: o.id,
      docNumber: o.docNumber,
      orderDate: o.orderDate,
      status: o.status,
      total: o.lines.reduce((sum, l) => sum + Number(l.orderedQty) * Number(l.unitCost), 0),
      itemsSummary: itemsSummary(o.lines),
    }));

  const grns = allGrns
    .filter((g) => g.supplierId === supplier.id)
    .map((g) => ({
      id: g.id,
      docNumber: g.docNumber,
      receivedDate: g.receivedDate,
      total: g.lines.reduce((sum, l) => sum + Number(l.receivedQty) * Number(l.unitCost), 0),
      itemsSummary: itemsSummary(g.lines),
    }));

  const payments = allPayments
    .filter((p) => p.supplierId === supplier.id)
    .map((p) => ({
      id: p.id,
      docNumber: p.docNumber,
      paymentDate: p.paymentDate,
      method: p.method,
      amount: p.amount,
      appliedTo: p.allocations.map((a) => a.invoice?.docNumber).filter(Boolean).join(", ") || "—",
    }));

  const returns = allReturns
    .filter((r) => r.supplierId === supplier.id)
    .map((r) => ({
      id: r.id,
      docNumber: r.docNumber,
      returnDate: r.returnDate,
      reason: r.reason,
      total: r.lines.reduce((sum, l) => sum + Number(l.qty) * Number(l.unitCost), 0),
      itemsSummary: itemsSummary(r.lines),
    }));

  const lifetimePurchases = orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0);
  const payable = payableRows.filter((r) => r.supplierId === supplier.id).reduce((sum, r) => sum + Number(r.amountDue), 0);

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/suppliers" className="font-medium text-brand-700 hover:text-brand-800">
          Suppliers
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-900">{supplier.name}</span>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl font-bold text-brand-700">
          {initialsOf(supplier.name)}
        </span>
        <div className="flex min-w-[220px] flex-1 flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">{supplier.name}</h1>
            <Badge tone={supplier.isActive ? "accent" : "slate"}>{supplier.isActive ? "Active" : "Inactive"}</Badge>
          </div>
          <span className="text-sm text-slate-500">
            {[supplier.phone, supplier.email].filter(Boolean).join(" · ") || "No contact details"}
          </span>
          {supplier.address && <span className="text-sm text-slate-500">{supplier.address}</span>}
        </div>
        <div className="flex gap-7">
          <div className="text-right">
            <div className="text-xs text-slate-400">Lifetime purchases</div>
            <div className="text-lg font-bold text-slate-900">{lifetimePurchases.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Currently payable</div>
            <div className={`text-lg font-bold ${payable > 0.0001 ? "text-danger-600" : "text-success-700"}`}>
              {payable.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
        <Link
          href="/purchasing/orders"
          className="flex h-10 flex-shrink-0 items-center gap-1.5 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
        >
          <ClipboardIcon className="h-4 w-4" />
          New purchase order
        </Link>
      </div>

      <SupplierDetailClient orders={orders} grns={grns} payments={payments} returns={returns} />
    </main>
  );
}
