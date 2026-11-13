"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, EmptyState, StatTile } from "@erp/ui/card";
import { Badge } from "@erp/ui/badge";
import { Button } from "@erp/ui/button";
import { Sheet } from "@erp/ui/sheet";
import { PlusIcon, WalletIcon } from "@/components/icons";
import { RunPayrollForm } from "./run-payroll-form";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface PayrollRunRow {
  id: string;
  periodYear: number;
  periodMonth: number;
  branchName: string;
  status: "draft" | "posted" | "paid";
  employeeCount: number;
  grossTotal: number;
  netTotal: number;
}

export function PayrollClient({ runs, branches, canProcess }: { runs: PayrollRunRow[]; branches: { id: string; name: string }[]; canProcess: boolean }) {
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();

  const pendingRuns = runs.filter((r) => r.status === "posted");
  const pendingTotal = pendingRuns.reduce((sum, r) => sum + r.netTotal, 0);
  const employeesToPay = pendingRuns.reduce((sum, r) => sum + r.employeeCount, 0);
  const latest = runs[0];

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        <StatTile label="Pending payroll (net)" value={pendingTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} tone="amber" />
        <StatTile label="Employees to pay" value={employeesToPay} />
        <StatTile label="Latest period" value={latest ? `${MONTH_NAMES[latest.periodMonth - 1]} ${latest.periodYear}` : "—"} />
      </div>

      {canProcess && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            Run payroll
          </Button>
        </div>
      )}

      {runs.length === 0 ? (
        <Card>
          <EmptyState icon={<WalletIcon className="h-5 w-5" />} title="No payroll runs yet." description="Run one above once you have active employees." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Payroll history</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Period</th>
                <th className="px-4 py-2.5">Branch</th>
                <th className="px-4 py-2.5 text-right">Employees</th>
                <th className="px-4 py-2.5 text-right">Gross pay</th>
                <th className="px-4 py-2.5 text-right">Net pay</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => router.push(`/hr/payroll/${r.id}`)}
                  className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {MONTH_NAMES[r.periodMonth - 1]} {r.periodYear}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{r.branchName}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{r.employeeCount}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{r.grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-900">{r.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={r.status === "paid" ? "accent" : "amber"}>{r.status === "paid" ? "Paid" : "Pending payment"}</Badge>
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
        title="Run payroll"
        description="Calculate and post payroll for a branch and period."
        icon={<WalletIcon className="h-4 w-4" />}
      >
        <RunPayrollForm branches={branches} onDone={() => setCreateOpen(false)} />
      </Sheet>
    </>
  );
}
