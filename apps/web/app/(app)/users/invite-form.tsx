"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter, FormSectionLabel } from "@erp/ui/form";
import { useToast } from "@erp/ui/toast";
import { PlusIcon } from "@/components/icons";
import { inviteUserAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function InviteUserForm({
  roles,
  branches,
  onDone,
}: {
  roles: { id: string; name: string }[];
  branches: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(inviteUserAction, undefined);
  const toast = useToast();
  const wasPending = useRef(false);

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      return;
    }
    if (!wasPending.current) return;
    wasPending.current = false;

    if (state?.error) {
      toast(state.error, "error");
    } else {
      toast("Staff member added.", "success");
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <form action={formAction} className="flex h-full flex-col">
      <FormBody>
      <FormSectionLabel>Personal information</FormSectionLabel>
      <div className="col-span-2">
        <Label>Name</Label>
        <input name="name" required placeholder="e.g. Ranil Fernando" className={inputClass} />
      </div>
      <div>
        <Label>Email</Label>
        <input name="email" type="email" required placeholder="name@company.com" className={inputClass} />
      </div>
      <div className="col-span-3">
        <Label>Temporary password</Label>
        <input name="password" type="password" required minLength={8} placeholder="At least 8 characters" className={inputClass} />
      </div>

      <FormSectionLabel>Role &amp; access</FormSectionLabel>
      <div>
        <Label>Role</Label>
        <select name="roleId" required className={inputClass}>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <Label>Branch access</Label>
        <select name="branchId" defaultValue="" className={inputClass}>
          <option value="">All branches (current company)</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Save staff member"}
        </Button>
      </FormFooter>
    </form>
  );
}
