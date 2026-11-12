"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { Input, Label, Select } from "@erp/ui/input";
import { signupAction } from "./actions";

function SectionHeading({ step, title }: { step: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
        {step}
      </span>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
    </div>
  );
}

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, undefined);

  return (
    <form action={formAction} className="space-y-8">
      <section>
        <SectionHeading step={1} title="Your shop" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="shopName">Shop name</Label>
            <Input id="shopName" name="shopName" required placeholder="Demo Hardware Shop" />
          </div>
          <div>
            <Label htmlFor="slug">Shop slug</Label>
            <Input id="slug" name="slug" required pattern="[a-z0-9-]+" placeholder="my-shop" />
            <p className="mt-1 text-xs text-slate-400">Lowercase letters, numbers, hyphens — this is what you sign in with.</p>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="businessType">Business type</Label>
            <Select id="businessType" name="businessType" defaultValue="">
              <option value="">Other / general</option>
              <option value="hardware">Hardware</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="grocery">Grocery / retail</option>
              <option value="textile">Textile / apparel</option>
              <option value="wholesale">Wholesale / distribution</option>
            </Select>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading step={2} title="Your account" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ownerName">Your name</Label>
            <Input id="ownerName" name="ownerName" required placeholder="Jane Perera" />
          </div>
          <div>
            <Label htmlFor="ownerEmail">Your email</Label>
            <Input id="ownerEmail" name="ownerEmail" type="email" required placeholder="you@shop.com" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ownerPassword">Password</Label>
            <Input id="ownerPassword" name="ownerPassword" type="password" required minLength={8} placeholder="At least 8 characters" />
          </div>
        </div>
      </section>

      {state?.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <div>
        <Button type="submit" disabled={pending} size="lg" className="w-full">
          {pending ? "Creating your shop..." : "Create my shop"}
        </Button>
        <p className="mt-3 text-center text-xs text-slate-400">
          Starts on the free POS plan — upgrade anytime. A Head Office branch and a starter chart
          of accounts for your business type are created automatically.
        </p>
      </div>
    </form>
  );
}
