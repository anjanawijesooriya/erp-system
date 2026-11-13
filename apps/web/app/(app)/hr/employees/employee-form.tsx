"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter, FormSectionLabel } from "@erp/ui/form";
import { useToast } from "@erp/ui/toast";
import { PlusIcon } from "@/components/icons";
import { createEmployeeAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function EmployeeForm({ branches, onDone }: { branches: { id: string; name: string }[]; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(createEmployeeAction, undefined);
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
      toast("Employee added.", "success");
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <form action={formAction} className="flex h-full flex-col">
      <FormBody>
      <FormSectionLabel>Personal information</FormSectionLabel>
      <div className="col-span-2">
        <Label>Full name</Label>
        <input name="name" required placeholder="e.g. Tharindu Silva" className={inputClass} />
      </div>
      <div>
        <Label>Employee #</Label>
        <input name="employeeNumber" required placeholder="e.g. EMP-0007" className={inputClass} />
      </div>
      <div>
        <Label>NIC number</Label>
        <input name="nic" placeholder="e.g. 200145612345" className={inputClass} />
      </div>
      <div className="col-span-2">
        <Label>Phone</Label>
        <input name="phone" placeholder="07X XXX XXXX" className={inputClass} />
      </div>

      <FormSectionLabel>Employment details</FormSectionLabel>
      <div>
        <Label>Branch</Label>
        <select name="branchId" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Select branch
          </option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <Label>Designation</Label>
        <input name="designation" placeholder="e.g. Warehouse assistant" className={inputClass} />
      </div>
      <div className="col-span-3">
        <Label>Join date</Label>
        <input type="date" name="dateOfJoining" required className={inputClass} />
      </div>

      <FormSectionLabel>Salary &amp; banking</FormSectionLabel>
      <div>
        <Label>Basic salary (LKR)</Label>
        <input type="number" step="0.01" name="basicSalary" required placeholder="0.00" className={inputClass} />
      </div>
      <div>
        <Label>Allowances (LKR)</Label>
        <input type="number" step="0.01" name="fixedAllowances" defaultValue={0} className={inputClass} />
      </div>
      <div>
        <Label>EPF member #</Label>
        <input name="epfMemberNumber" className={inputClass} />
      </div>
      <div>
        <Label>ETF member #</Label>
        <input name="etfMemberNumber" className={inputClass} />
      </div>
      <div>
        <Label>Bank name</Label>
        <input name="bankName" placeholder="e.g. Commercial Bank" className={inputClass} />
      </div>
      <div>
        <Label>Bank account #</Label>
        <input name="bankAccountNumber" className={inputClass} />
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Save employee"}
        </Button>
      </FormFooter>
    </form>
  );
}
