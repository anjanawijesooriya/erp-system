"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { inviteUserAction } from "./actions";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

export function InviteUserForm({
  roles,
  branches,
}: {
  roles: { id: string; name: string }[];
  branches: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(inviteUserAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
        <input name="name" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
        <input name="email" type="email" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Temporary password</label>
        <input name="password" type="password" required minLength={8} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Role</label>
        <select name="roleId" required className={inputClass}>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-600">
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
      {state?.error && <p className="col-span-3 text-sm text-red-600">{state.error}</p>}
      <div className="col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Inviting..." : "Invite user"}
        </Button>
      </div>
    </form>
  );
}
