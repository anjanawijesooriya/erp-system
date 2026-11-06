import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { tenants } from "@erp/db/schema";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { getSubscription } from "@erp/core/plans";
import { requireSession } from "@/lib/session";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const { tenantId, userId } = await requireSession();
  const [tenant, canManage, subscription] = await Promise.all([
    db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) }),
    can(userId, PERMISSIONS.TENANT_SETTINGS_MANAGE),
    getSubscription(tenantId),
  ]);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
      {canManage ? (
        <div className="space-y-6">
          <div className="max-w-sm rounded-xl border border-slate-200 bg-white shadow-sm p-4 text-sm">
            <div className="mb-1 font-medium">Plan</div>
            <p className="text-slate-600">
              {subscription?.plan ? subscription.plan.toUpperCase() : "POS"} ·{" "}
              {subscription?.status ?? "trialing"}
            </p>
          </div>
          <SettingsForm currentPhone={tenant?.ownerPhone ?? null} />
          <div className="max-w-sm rounded-xl border border-slate-200 bg-white shadow-sm p-4 text-sm">
            <div className="mb-1 font-medium">Export your data</div>
            <p className="mb-3 text-slate-600">
              Download a JSON snapshot of your tenant&apos;s master data and transaction headlines.
            </p>
            <a
              href="/api/export-data"
              className="inline-block rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            >
              Download export
            </a>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">You don&apos;t have permission to change settings.</p>
      )}
    </main>
  );
}
