"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@erp/ui/dialog";
import { cancelProductionOrderAction, completeProductionOrderAction } from "./actions";

export function OrderActions({ productionOrderId, plannedBatches }: { productionOrderId: string; plannedBatches: number }) {
  const [pending, startTransition] = useTransition();
  const [actualQuantity, setActualQuantity] = useState(String(plannedBatches));
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  function onComplete() {
    startTransition(async () => {
      await completeProductionOrderAction(productionOrderId, Number(actualQuantity));
    });
  }

  function onCancel() {
    startTransition(async () => {
      await cancelProductionOrderAction(productionOrderId);
      setConfirmingCancel(false);
    });
  }

  return (
    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
      <input
        type="number"
        step="0.01"
        value={actualQuantity}
        onChange={(e) => setActualQuantity(e.target.value)}
        className="w-20 rounded-md border border-slate-300 px-2 py-1 text-xs"
      />
      <button onClick={onComplete} disabled={pending} className="text-xs font-medium text-brand-700 hover:underline disabled:opacity-50">
        Complete
      </button>
      <button onClick={() => setConfirmingCancel(true)} disabled={pending} className="text-xs font-medium text-danger-600 hover:underline disabled:opacity-50">
        Cancel
      </button>
      <ConfirmDialog
        open={confirmingCancel}
        title="Cancel this production order?"
        description="This can't be undone."
        confirmLabel="Cancel order"
        variant="destructive"
        pending={pending}
        onConfirm={onCancel}
        onCancel={() => setConfirmingCancel(false)}
      />
    </div>
  );
}
