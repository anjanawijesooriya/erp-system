import { signOut } from "@/auth";
import { SignOutIcon } from "./icons";

export function Topbar({ tenantName, email }: { tenantName: string; email: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 print:hidden">
      <div>
        <p className="text-sm font-medium text-slate-900">{tenantName}</p>
        <p className="text-xs text-slate-500">{email}</p>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <SignOutIcon className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </header>
  );
}
