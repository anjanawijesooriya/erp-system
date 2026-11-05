"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { createEmployeeAction } from "./actions";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

export function EmployeeForm({ branches }: { branches: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createEmployeeAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-4 gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Employee #</label>
        <input name="employeeNumber" required className={inputClass} />
      </div>
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
        <input name="name" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Branch</label>
        <select name="branchId" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Select...
          </option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">NIC</label>
        <input name="nic" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Phone</label>
        <input name="phone" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Designation</label>
        <input name="designation" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Date of joining</label>
        <input type="date" name="dateOfJoining" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Basic salary (LKR)</label>
        <input type="number" step="0.01" name="basicSalary" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Fixed allowances (LKR)</label>
        <input type="number" step="0.01" name="fixedAllowances" defaultValue={0} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">EPF member #</label>
        <input name="epfMemberNumber" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">ETF member #</label>
        <input name="etfMemberNumber" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Bank name</label>
        <input name="bankName" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Bank account #</label>
        <input name="bankAccountNumber" className={inputClass} />
      </div>
      {state?.error && <p className="col-span-4 text-sm text-red-600">{state.error}</p>}
      <div className="col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding..." : "Add employee"}
        </Button>
      </div>
    </form>
  );
}
