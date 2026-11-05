import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { tenants } from "@erp/db/schema";
import { signOut } from "@/auth";
import { requireSession } from "@/lib/session";
import { AppNav } from "@/components/app-nav";

export default async function DashboardPage() {
  const { tenantId, email } = await requireSession();
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Signed in as {email} · Tenant: {tenant?.name ?? "unknown"}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" type="submit">
            Sign out
          </button>
        </form>
      </div>
      <AppNav />
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Phase 1 + Phase 2 master data are up: tenants, branches, users, RBAC, audit log,
        products/variants/UoM, customers, suppliers and chart of accounts. Inventory, purchasing,
        sales and accounting posting come in later phases.
      </div>
    </main>
  );
}
