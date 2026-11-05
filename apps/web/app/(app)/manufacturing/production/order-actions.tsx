"use client";

import { useState, useTransition } from "react";
import { cancelProductionOrderAction, completeProductionOrderAction } from "./actions";

export function OrderActions({ productionOrderId, plannedBatches }: { productionOrderId: string; plannedBatches: number }) {
  const [pending, startTransition] = useTransition();
  const [actualQuantity, setActualQuantity] = useState(String(plannedBatches));

  function onComplete() {
    startTransition(async () => {
      await completeProductionOrderAction(productionOrderId, Number(actualQuantity));
    });
  }

  function onCancel() {
    if (!confirm("Cancel this production order?")) return;
    startTransition(async () => {
      await cancelProductionOrderAction(productionOrderId);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        step="0.01"
        value={actualQuantity}
        onChange={(e) => setActualQuantity(e.target.value)}
        className="w-20 rounded-md border border-slate-300 px-2 py-1 text-xs"
      />
      <button onClick={onComplete} disabled={pending} className="text-xs text-blue-600 hover:underline disabled:opacity-50">
        Complete
      </button>
      <button onClick={onCancel} disabled={pending} className="text-xs text-red-600 hover:underline disabled:opacity-50">
        Cancel
      </button>
    </div>
  );
}
