"use client";

import { useTransition } from "react";
import { deactivateChannelAction } from "./actions";

export function DeactivateChannelButton({ channelId }: { channelId: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm("Deactivate this sales channel? Its webhook will stop accepting new orders.")) return;
    startTransition(async () => {
      await deactivateChannelAction(channelId);
    });
  }

  return (
    <button onClick={onClick} disabled={pending} className="text-xs text-red-600 hover:underline disabled:opacity-50">
      {pending ? "..." : "Deactivate"}
    </button>
  );
}
