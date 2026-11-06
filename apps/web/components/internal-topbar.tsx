import type { ReactNode } from "react";
import { SignOutIcon } from "./icons";

/**
 * Topbar for the two internal tools (platform admin, accountant portal) —
 * deliberately dark/slate rather than the tenant app's white+brand chrome,
 * so neither ever reads as "a shop's own workspace".
 */
export function InternalTopbar({
  label,
  title,
  subtitle,
  logoutAction,
}: {
  label: string;
  title: string;
  subtitle: string;
  logoutAction: () => Promise<void>;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{title}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-300">
                {label}
              </span>
            </div>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <SignOutIcon className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}

export function InternalShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
