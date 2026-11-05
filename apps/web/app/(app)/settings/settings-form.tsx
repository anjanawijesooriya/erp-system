"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { updateSettingsAction } from "./actions";

export function SettingsForm({ currentPhone }: { currentPhone: string | null }) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, undefined);

  return (
    <form action={formAction} className="max-w-sm rounded-lg border border-slate-200 bg-white p-4">
      <label className="mb-1 block text-xs font-medium text-slate-600">
        Owner phone (for the daily SMS summary, E.164 format e.g. +94771234567)
      </label>
      <input
        name="ownerPhone"
        defaultValue={currentPhone ?? ""}
        placeholder="+94771234567"
        className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      {state?.error && <p className="mb-2 text-sm text-red-600">{state.error}</p>}
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
