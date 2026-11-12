"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@erp/ui/toast";

/**
 * Fires a toast whenever a useActionState result settles (pending -> not
 * pending) with a server action's { error?: string } shape: success message
 * on a clean result, the error text on failure. Skips the very first render
 * so a fresh/undefined state doesn't toast before the user submits anything.
 */
export function useActionToast(state: { error?: string } | undefined, pending: boolean, successMessage: string) {
  const toast = useToast();
  const wasPending = useRef(false);

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      return;
    }
    if (!wasPending.current) return;
    wasPending.current = false;

    if (state?.error) {
      toast(state.error, "error");
    } else {
      toast(successMessage, "success");
    }
  }, [pending, state, toast, successMessage]);
}
