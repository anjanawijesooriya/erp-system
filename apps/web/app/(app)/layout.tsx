import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { tenants } from "@erp/db/schema";
import { requireSession } from "@/lib/session";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

/**
 * Shared chrome for every authenticated, tenant-scoped page — sidebar +
 * topbar rendered once here instead of each of the ~40 pages under this
 * route group repeating its own `<AppNav />`. Pages keep their own inner
 * `<main>` wrapper for page-specific width/padding; this layout only owns
 * the persistent nav and the scrollable content region around it.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { tenantId, email } = await requireSession();
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 print:block print:h-auto print:overflow-visible print:bg-white">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col print:block">
        <Topbar tenantName={tenant?.name ?? "Unknown shop"} email={email} />
        <div className="flex-1 overflow-y-auto print:overflow-visible">{children}</div>
      </div>
    </div>
  );
}
