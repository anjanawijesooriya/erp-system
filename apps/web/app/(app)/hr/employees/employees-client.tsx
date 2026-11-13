"use client";

import { useMemo, useState } from "react";
import { Card, EmptyState, StatTile } from "@erp/ui/card";
import { Badge } from "@erp/ui/badge";
import { Button } from "@erp/ui/button";
import { Pagination } from "@erp/ui/pagination";
import { Sheet } from "@erp/ui/sheet";
import { PlusIcon, UsersIcon, SearchIcon } from "@/components/icons";
import { EmployeeForm } from "./employee-form";
import { TerminateButton } from "./terminate-button";

export interface EmployeeRow {
  id: string;
  employeeNumber: string;
  name: string;
  designation: string | null;
  branchName: string;
  basicSalary: string;
  fixedAllowances: string;
  status: "active" | "terminated";
  dateOfJoining: string;
}

const AVATAR_TONES = ["bg-brand-700", "bg-success-600", "bg-warning-600", "bg-info-600", "bg-slate-500", "bg-danger-600"];

function avatarToneFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const PAGE_SIZE = 8;

export function EmployeesClient({
  employees,
  branches,
  canManage,
}: {
  employees: EmployeeRow[];
  branches: { id: string; name: string }[];
  canManage: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [page, setPage] = useState(1);

  const active = employees.filter((e) => e.status === "active");
  const monthlyPayroll = active.reduce((sum, e) => sum + Number(e.basicSalary) + Number(e.fixedAllowances), 0);
  const quarterAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d;
  }, []);
  const newThisQuarter = employees.filter((e) => new Date(e.dateOfJoining) >= quarterAgo).length;

  const filtered = employees.filter((e) => {
    if (branchFilter && e.branchName !== branchFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!e.name.toLowerCase().includes(q) && !(e.designation ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  function updateFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        <StatTile label="Active employees" value={active.length} />
        <StatTile label="Monthly payroll" value={monthlyPayroll.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
        <StatTile label="New this quarter" value={`+${newThisQuarter}`} tone="accent" />
      </div>

      {canManage && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            Add employee
          </Button>
        </div>
      )}

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[240px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => updateFilter(() => setSearch(e.target.value))}
            placeholder="Search by name or designation…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <select
          value={branchFilter}
          onChange={(e) => updateFilter(() => setBranchFilter(e.target.value))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
      </Card>

      {employees.length === 0 ? (
        <Card>
          <EmptyState icon={<UsersIcon className="h-5 w-5" />} title="No employees yet." description="Add your team to start running payroll." />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<SearchIcon className="h-5 w-5" />} title="No matching employees." description="Try a different search or filter." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Designation</th>
                <th className="px-4 py-2.5">Branch</th>
                <th className="px-4 py-2.5 text-right">Monthly salary</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((e) => (
                <tr key={e.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarToneFor(e.id)}`}>
                        {initialsOf(e.name)}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-900">{e.name}</div>
                        <div className="text-xs text-slate-400">{e.employeeNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{e.designation ?? "—"}</td>
                  <td className="px-4 py-2.5 text-slate-600">{e.branchName}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-900">
                    {(Number(e.basicSalary) + Number(e.fixedAllowances)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={e.status === "active" ? "accent" : "slate"}>{e.status === "active" ? "Active" : "Terminated"}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">{canManage && e.status === "active" && <TerminateButton employeeId={e.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={pageSafe}
            totalPages={totalPages}
            onChange={setPage}
            summary={`Showing ${(pageSafe - 1) * PAGE_SIZE + 1}–${Math.min(pageSafe * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
          />
        </Card>
      )}

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add employee"
        description="Employee records feed payroll — keep salary and bank details accurate."
        icon={<UsersIcon className="h-4 w-4" />}
      >
        <EmployeeForm branches={branches} onDone={() => setCreateOpen(false)} />
      </Sheet>
    </>
  );
}
