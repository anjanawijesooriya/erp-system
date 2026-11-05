"use client";

import { useTransition } from "react";
import { viewTenantAction } from "./actions";

export function ViewButton({ tenantId }: { tenantId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => viewTenantAction(tenantId))}
      className="text-xs text-blue-700 hover:underline"
    >
      {pending ? "Logging..." : "Log view (audit)"}
    </button>
  );
}
