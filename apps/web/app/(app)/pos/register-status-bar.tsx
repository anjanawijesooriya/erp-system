"use client";

import { useState } from "react";
import { Button } from "@erp/ui/button";
import { Input, Label } from "@erp/ui/input";

export function RegisterStatusBar({
  branchId,
  openingBalance,
  openedAt,
  openedByName,
  pending,
  error,
  onClose,
}: {
  branchId: string;
  openingBalance: string;
  openedAt: string;
  openedByName: string;
  pending: boolean;
  error: string | null;
  onClose: (formData: FormData) => void;
}) {
  const [showClose, setShowClose] = useState(false);

  const openedTime = new Date(openedAt).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" });

  return (
    <div className="mb-4 rounded-xl border border-accent-200 bg-accent-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-accent-800">
          <span className="h-2 w-2 rounded-full bg-accent-500" />
          <span className="font-medium">Register open</span>
          <span className="text-accent-600">
            · opened by {openedByName || "—"} at {openedTime} · float {Number(openingBalance).toLocaleString()}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowClose((v) => !v)}
          className="text-sm font-medium text-accent-700 hover:underline"
        >
          {showClose ? "Cancel" : "Close register"}
        </button>
      </div>

      {showClose && (
        <form
          action={(formData) => onClose(formData)}
          className="mt-3 grid grid-cols-1 gap-3 border-t border-accent-200 pt-3 sm:grid-cols-3"
        >
          <input type="hidden" name="branchId" value={branchId} />
          <div>
            <Label htmlFor="countedBalance">Cash counted (LKR)</Label>
            <Input id="countedBalance" name="countedBalance" type="number" step="0.01" min="0" required placeholder="0.00" />
          </div>
          <div className="sm:col-span-1">
            <Label htmlFor="closeNote">Note (optional)</Label>
            <Input id="closeNote" name="note" placeholder="e.g. Short by 200, receipt missing" />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={pending} variant="destructive" className="w-full">
              {pending ? "Closing..." : "Confirm close"}
            </Button>
          </div>
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-3">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
