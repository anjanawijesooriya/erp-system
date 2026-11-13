"use client";

import { useState } from "react";
import { Card, EmptyState, StatTile } from "@erp/ui/card";
import { Badge, type BadgeTone } from "@erp/ui/badge";
import { Button } from "@erp/ui/button";
import { Sheet, DetailRow, DetailSection } from "@erp/ui/sheet";
import { PlusIcon, ClipboardIcon } from "@/components/icons";
import { ProductionOrderForm } from "./production-form";
import { OrderActions } from "./order-actions";

interface ComponentNeed {
  componentName: string;
  componentSku: string;
  required: number;
  available: number;
}

export interface ProductionOrderRow {
  id: string;
  bomName: string;
  outputSku: string;
  branchName: string;
  warehouseName: string;
  plannedBatches: string;
  actualOutputQuantity: string | null;
  status: "draft" | "completed" | "cancelled";
  createdAt: string;
  materialCost: number;
  components: ComponentNeed[];
}

const STATUS_TONE: Record<string, BadgeTone> = { draft: "amber", completed: "accent", cancelled: "slate" };
const STATUS_LABEL: Record<string, string> = { draft: "In progress", completed: "Completed", cancelled: "Cancelled" };

export function ProductionClient({
  orders,
  branches,
  warehouses,
  boms,
  canManage,
}: {
  orders: ProductionOrderRow[];
  branches: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  boms: { id: string; label: string }[];
  canManage: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<ProductionOrderRow | null>(null);

  const now = new Date();
  const inProgress = orders.filter((o) => o.status === "draft");
  const completedThisMonth = orders.filter((o) => {
    if (o.status !== "completed") return false;
    const d = new Date(o.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const unitsProduced = completedThisMonth.reduce((sum, o) => sum + Number(o.actualOutputQuantity ?? 0), 0);
  const materialCost = completedThisMonth.reduce((sum, o) => sum + o.materialCost, 0);

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <StatTile label="In progress" value={inProgress.length} tone="amber" />
        <StatTile label="Completed this month" value={completedThisMonth.length} tone="accent" />
        <StatTile label="Units produced" value={unitsProduced} />
        <StatTile label="Material cost this month" value={materialCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
      </div>

      {canManage && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New production order
          </Button>
        </div>
      )}

      {orders.length === 0 ? (
        <Card>
          <EmptyState icon={<ClipboardIcon className="h-5 w-5" />} title="No production orders yet." description="Build finished goods from a BOM, consuming raw material stock." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Product</th>
                <th className="px-4 py-2.5">Warehouse</th>
                <th className="px-4 py-2.5 text-right">Planned batches</th>
                <th className="px-4 py-2.5 text-right">Actual output</th>
                <th className="px-4 py-2.5">Status</th>
                {canManage && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} onClick={() => setSelected(o)} className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-900">{o.bomName}</div>
                    <div className="text-xs text-slate-400">→ {o.outputSku}</div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{o.warehouseName}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{o.plannedBatches}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{o.actualOutputQuantity ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                  </td>
                  {canManage && (
                    <td className="px-4 py-2.5">{o.status === "draft" && <OrderActions productionOrderId={o.id} plannedBatches={Number(o.plannedBatches)} />}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New production order"
        description="Build finished goods from a BOM, consuming raw material stock."
        icon={<ClipboardIcon className="h-4 w-4" />}
      >
        <ProductionOrderForm branches={branches} warehouses={warehouses} boms={boms} onDone={() => setCreateOpen(false)} />
      </Sheet>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.bomName ?? ""}
        description="Production order details"
        icon={<ClipboardIcon className="h-4 w-4" />}
        width="md"
      >
        {selected && (
          <>
            <DetailSection title="Overview">
              <DetailRow label="Status" value={<Badge tone={STATUS_TONE[selected.status]}>{STATUS_LABEL[selected.status]}</Badge>} />
              <DetailRow label="Branch" value={selected.branchName} />
              <DetailRow label="Warehouse" value={selected.warehouseName} />
              <DetailRow label="Planned batches" value={selected.plannedBatches} />
              {selected.actualOutputQuantity && <DetailRow label="Actual output" value={selected.actualOutputQuantity} />}
            </DetailSection>
            <DetailSection title={`Materials needed (× ${selected.plannedBatches} batches)`}>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Component</th>
                      <th className="px-3 py-2 text-right">Required</th>
                      <th className="px-3 py-2 text-right">Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.components.map((c) => (
                      <tr key={c.componentSku} className="border-t border-slate-100">
                        <td className="px-3 py-1.5">
                          {c.componentName}
                          <div className="text-xs text-slate-400">{c.componentSku}</div>
                        </td>
                        <td className="px-3 py-1.5 text-right">{c.required}</td>
                        <td className={`px-3 py-1.5 text-right font-medium ${c.available < c.required ? "text-danger-600" : "text-success-700"}`}>{c.available}</td>
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
