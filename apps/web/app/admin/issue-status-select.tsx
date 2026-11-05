"use client";

import { useTransition } from "react";
import { adminUpdateIssueStatusAction } from "./actions";

type Status = "open" | "in_progress" | "resolved" | "closed";

export function AdminIssueStatusSelect({ issueId, status }: { issueId: string; status: Status }) {
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as Status;
    startTransition(async () => {
      await adminUpdateIssueStatusAction(issueId, value);
    });
  }

  return (
    <select
      defaultValue={status}
      onChange={onChange}
      disabled={pending}
      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
    >
      <option value="open">Open</option>
      <option value="in_progress">In progress</option>
      <option value="resolved">Resolved</option>
      <option value="closed">Closed</option>
    </select>
  );
}
