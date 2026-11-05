"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { signupAction } from "./actions";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Shop name</label>
        <input name="shopName" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Shop slug (used to sign in, lowercase letters/numbers/hyphens only)
        </label>
        <input name="slug" required pattern="[a-z0-9-]+" placeholder="my-shop" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Business type</label>
        <select name="businessType" className={inputClass} defaultValue="">
          <option value="">Other / general</option>
          <option value="hardware">Hardware</option>
          <option value="pharmacy">Pharmacy</option>
          <option value="grocery">Grocery / retail</option>
          <option value="textile">Textile / apparel</option>
          <option value="wholesale">Wholesale / distribution</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Your name</label>
        <input name="ownerName" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Your email</label>
        <input name="ownerEmail" type="email" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Password</label>
        <input name="ownerPassword" type="password" required minLength={8} className={inputClass} />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating your shop..." : "Create my shop"}
      </Button>
      <p className="text-xs text-slate-500">
        Starts on the free POS plan — you can upgrade later. A Head Office branch and a starter
        chart of accounts for your business type are created automatically.
      </p>
    </form>
  );
}
