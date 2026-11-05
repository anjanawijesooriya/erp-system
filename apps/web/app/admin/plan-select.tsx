"use client";

import { useTransition } from "react";
import { changePlanAction } from "./actions";

export function PlanSelect({ tenantId, currentPlan }: { tenantId: string; currentPlan: string | null }) {
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const formData = new FormData();
    formData.set("tenantId", tenantId);
    formData.set("plan", e.target.value);
    startTransition(async () => {
      await changePlanAction(undefined, formData);
    });
  }

  return (
    <select
      defaultValue={currentPlan ?? "pos"}
      onChange={onChange}
      disabled={pending}
      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
    >
      <option value="pos">POS</option>
      <option value="business">Business</option>
      <option value="erp">ERP</option>
    </select>
  );
}
