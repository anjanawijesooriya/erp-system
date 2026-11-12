"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronIcon } from "./icons";

function initialsFor(email: string) {
  const name = email.split("@")[0] ?? "";
  const parts = name.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

/** Avatar + dropdown holding shop/user identity and the sign-out form (passed in as children, since it wraps a server action). */
export function UserMenu({ tenantName, email, children }: { tenantName: string; email: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
          {initialsFor(email)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-slate-900">{tenantName}</span>
          <span className="block text-xs leading-tight text-slate-500">{email}</span>
        </span>
        <ChevronIcon className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
          style={{ animation: "dialog-in 0.12s ease-out" }}
        >
          <div className="border-b border-slate-100 px-3 py-2 sm:hidden">
            <p className="text-sm font-medium text-slate-900">{tenantName}</p>
            <p className="text-xs text-slate-500">{email}</p>
          </div>
          <div className="p-0.5">{children}</div>
        </div>
      )}
    </div>
  );
}
