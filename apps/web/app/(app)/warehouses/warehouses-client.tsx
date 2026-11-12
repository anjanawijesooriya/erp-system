"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, EmptyState } from "@erp/ui/card";
import { Badge, toneForStatus } from "@erp/ui/badge";
import { Button } from "@erp/ui/button";
import { Sheet } from "@erp/ui/sheet";
import { PlusIcon, BuildingIcon, SwapIcon } from "@/components/icons";
import { WarehouseForm } from "./warehouse-form";

interface WarehouseStat {
  id: string;
  name: string;
  code: string;
  branchName: string;
  isDefault: boolean;
  skuCount: number;
  stockValue: number;
}

interface RecentTransfer {
  id: string;
  createdAt: string;
  status: string;
  lineCount: number;
  fromWarehouseName: string;
  toWarehouseName: string;
}

export function WarehousesClient({
  warehouseStats,
  recentTransfers,
  branches,
  canManage,
}: {
  warehouseStats: WarehouseStat[];
  recentTransfers: RecentTransfer[];
  branches: { id: string; name: string }[];
  canManage: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      {canManage && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            Add warehouse
          </Button>
        </div>
      )}

      {warehouseStats.length === 0 ? (
        <Card>
          <EmptyState icon={<BuildingIcon className="h-5 w-5" />} title="No warehouses yet." description="Add one to start tracking stock." />
        </Card>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouseStats.map((w) => (
            <Card key={w.id} className="flex flex-col gap-3.5 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand-50 text-brand-700">
                    <BuildingIcon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <div className="text-[15px] font-semibold text-slate-900">{w.name}</div>
                    <div className="text-xs text-slate-400">{w.branchName}</div>
                  </div>
                </div>
                {w.isDefault && <Badge tone="accent">Default</Badge>}
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-600">
                <span>SKUs on hand</span>
                <span className="font-semibold text-slate-900">{w.skuCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Stock value</span>
                <span className="font-semibold text-slate-900">{w.stockValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <Link href="/inventory" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                View stock →
              </Link>
            </Card>
          ))}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Recent transfers</h3>
        </div>
        {recentTransfers.length === 0 ? (
          <EmptyState icon={<SwapIcon className="h-5 w-5" />} title="No transfers yet." description="Move stock between warehouses from the Transfers page." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">From</th>
                <th className="px-4 py-2.5">To</th>
                <th className="px-4 py-2.5">Items</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTransfers.map((t) => (
                <tr key={t.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 font-medium text-slate-900">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 text-slate-600">{t.fromWarehouseName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{t.toWarehouseName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{t.lineCount} line{t.lineCount === 1 ? "" : "s"}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={toneForStatus(t.status)}>{t.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New warehouse"
        description="Add a physical location to hold stock."
        icon={<BuildingIcon className="h-4 w-4" />}
      >
        <WarehouseForm branches={branches} />
      </Sheet>
    </>
  );
}
