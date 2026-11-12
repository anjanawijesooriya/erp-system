"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { useActionToast } from "@/lib/use-action-toast";
import { updateSettingsAction } from "./actions";

export function SettingsForm({ currentPhone }: { currentPhone: string | null }) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, undefined);
  useActionToast(state, pending, "Settings saved.");

  return (
    <form action={formAction} className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        Owner phone (for the daily SMS summary, E.164 format e.g. +94771234567)
      </label>
      <input
        name="ownerPhone"
        defaultValue={currentPhone ?? ""}
        placeholder="+94771234567"
        className="mb-3 w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </Button>
      <p className="mt-2 text-xs text-slate-500">
        Leave blank to disable the daily SMS summary. Requires Notify.lk credentials to be
        configured on the worker (NOTIFYLK_USER_ID / NOTIFYLK_API_KEY) — without those, the
        summary is computed but not sent.
      </p>
    </form>
  );
}
