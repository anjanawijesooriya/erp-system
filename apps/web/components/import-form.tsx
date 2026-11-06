"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";

type ImportAction = (
  prevState: { error?: string; summary?: string } | undefined,
  formData: FormData,
) => Promise<{ error?: string; summary?: string }>;

export function ImportForm({ action, columnsHint }: { action: ImportAction; columnsHint: string }) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <p className="text-xs text-slate-500">Columns: {columnsHint}</p>
      <div className="flex items-center gap-3">
        <input name="file" type="file" accept=".xlsx" required className="text-sm" />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Importing..." : "Import .xlsx"}
        </Button>
      </div>
      {state?.error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.summary && <p className="text-sm text-slate-600">{state.summary}</p>}
    </form>
  );
}
