"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormHeader, FormBody, FormFooter } from "@erp/ui/form";
import { PlusIcon } from "./icons";
import { useActionToast } from "@/lib/use-action-toast";

type PartyAction = (
  prevState: { error?: string } | undefined,
  formData: FormData,
) => Promise<{ error?: string }>;

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function PartyForm({
  action,
  submitLabel,
  title = "New party",
  icon,
}: {
  action: PartyAction;
  submitLabel: string;
  title?: string;
  icon?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  useActionToast(state, pending, `${submitLabel} succeeded.`);

  return (
    <form action={formAction} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <FormHeader icon={icon} title={title} />
      <FormBody className="sm:grid-cols-2">
      <div>
        <Label>Code (optional)</Label>
        <input name="code" className={inputClass} />
      </div>
      <div>
        <Label>Name</Label>
        <input name="name" required className={inputClass} />
      </div>
      <div>
        <Label>Phone</Label>
        <input name="phone" className={inputClass} />
      </div>
      <div>
        <Label>Email</Label>
        <input name="email" type="email" className={inputClass} />
      </div>
      <div className="col-span-2">
        <Label>Address</Label>
        <input name="address" className={inputClass} />
      </div>
      <div>
        <Label>Tax ID</Label>
        <input name="taxId" className={inputClass} />
      </div>
      <div>
        <Label>Credit limit</Label>
        <input name="creditLimit" type="number" step="0.01" min="0" defaultValue="0" className={inputClass} />
      </div>
      <div>
        <Label>Credit term (days)</Label>
        <input name="creditTermDays" type="number" min="0" defaultValue="0" className={inputClass} />
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : submitLabel}
        </Button>
      </FormFooter>
    </form>
  );
}
