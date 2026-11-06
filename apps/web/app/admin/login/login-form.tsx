"use client";

import { useActionState } from "react";
import { Button } from "@erp/ui/button";
import { Input, Label } from "@erp/ui/input";
import { adminLoginAction } from "./actions";

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLoginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      {state?.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
