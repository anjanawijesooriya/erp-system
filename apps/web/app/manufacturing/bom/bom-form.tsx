"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { createBomAction } from "./actions";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

export function BomForm({ variants }: { variants: { id: string; label: string }[] }) {
  const [state, formAction, pending] = useActionState(createBomAction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">BOM name</label>
        <input name="name" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Output product</label>
        <select name="outputVariantId" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Select...
          </option>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-600">Output quantity per batch</label>
        <input type="number" step="0.01" name="outputQuantity" required defaultValue={1} className={inputClass} />
      </div>
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Components — one per line, as "SKU,quantity per batch"
        </label>
        <textarea
          name="lines"
          required
          rows={5}
          placeholder={"RAW-WOOD,2\nRAW-NAILS,10"}
          className={`${inputClass} font-mono`}
        />
      </div>
      {state?.error && <p className="col-span-2 text-sm text-red-600">{state.error}</p>}
      <div className="col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Create BOM"}
        </Button>
      </div>
    </form>
  );
}
