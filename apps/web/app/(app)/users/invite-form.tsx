"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { inviteUserAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function InviteUserForm({
  roles,
  branches,
}: {
  roles: { id: string; name: string }[];
  branches: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(inviteUserAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
        <input name="name" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Temporary password</label>
        <input name="password" type="password" required minLength={8} className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
        <select name="roleId" required className={inputClass}>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Branch (optional — leave blank for tenant-wide access)
        </label>
        <select name="branchId" defaultValue="" className={inputClass}>
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      {state?.error && <p className="col-span-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Inviting..." : "Invite user"}
        </Button>
      </div>
    </form>
  );
}
