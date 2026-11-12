import { signOut } from "@/auth";
import { SignOutIcon } from "./icons";
import { UserMenu } from "./user-menu";
import { Breadcrumbs } from "./breadcrumbs";

export function Topbar({ tenantName, email }: { tenantName: string; email: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 print:hidden">
      <Breadcrumbs />
      <UserMenu tenantName={tenantName} email={email}>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-rose-600"
          >
            <SignOutIcon className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </UserMenu>
    </header>
  );
}
