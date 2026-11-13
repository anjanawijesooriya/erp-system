"use client";

import { useMemo, useState } from "react";
import { Card, EmptyState } from "@erp/ui/card";
import { Badge, type BadgeTone } from "@erp/ui/badge";
import { Button } from "@erp/ui/button";
import { Pagination } from "@erp/ui/pagination";
import { Sheet } from "@erp/ui/sheet";
import { PlusIcon, UsersIcon, SearchIcon } from "@/components/icons";
import { InviteUserForm } from "./invite-form";
import { DeactivateButton } from "./deactivate-button";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  roleNames: string[];
  branchNames: string[];
}

const ROLE_TONES: BadgeTone[] = ["brand", "amber", "sky", "violet", "accent", "rose"];

function toneForRole(name: string): BadgeTone {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return ROLE_TONES[hash % ROLE_TONES.length]!;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_TONES = ["bg-brand-700", "bg-success-600", "bg-warning-600", "bg-info-600", "bg-slate-500", "bg-danger-600"];

function avatarToneFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

const PAGE_SIZE = 8;

export function UsersClient({
  users,
  roles,
  branches,
  canManage,
}: {
  users: UserRow[];
  roles: { id: string; name: string }[];
  branches: { id: string; name: string }[];
  canManage: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  const allRoleNames = useMemo(() => Array.from(new Set(users.flatMap((u) => u.roleNames))).sort(), [users]);

  const filtered = users.filter((u) => {
    if (roleFilter && !u.roleNames.includes(roleFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
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
      {canManage && roles.length > 0 && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            Add staff
          </Button>
        </div>
      )}

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[240px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => updateFilter(() => setSearch(e.target.value))}
            placeholder="Search by name or email…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => updateFilter(() => setRoleFilter(e.target.value))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="">All roles</option>
          {allRoleNames.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Card>

      {users.length === 0 ? (
        <Card>
          <EmptyState icon={<UsersIcon className="h-5 w-5" />} title="No staff yet." description="Add your team to give them sign-in access." />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<SearchIcon className="h-5 w-5" />} title="No matching staff." description="Try a different search or filter." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Branch access</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarToneFor(u.id)}`}>
                        {initialsOf(u.name)}
                      </span>
                      <span className="font-semibold text-slate-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{u.email}</td>
                  <td className="px-4 py-2.5 text-slate-600">{u.branchNames.length === 0 ? "All branches" : u.branchNames.join(", ")}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {u.roleNames.length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        u.roleNames.map((r) => (
                          <Badge key={r} tone={toneForRole(r)}>
                            {r}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={u.isActive ? "accent" : "slate"}>{u.isActive ? "Active" : "Suspended"}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">{canManage && <DeactivateButton userId={u.id} isActive={u.isActive} />}</td>
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
        title="Add staff member"
        description="Create a new user account with specific branch access."
        icon={<UsersIcon className="h-4 w-4" />}
      >
        <InviteUserForm roles={roles} branches={branches} onDone={() => setCreateOpen(false)} />
      </Sheet>
    </>
  );
}
