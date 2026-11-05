import { hasModule, PLAN_TIERS, type ModuleKey } from "@erp/core/plans";

/**
 * Wraps a plan-gated page: renders `children` if the tenant's plan
 * includes `moduleKey`, otherwise a short "upgrade your plan" notice
 * instead of the page content. Checked server-side on every request —
 * there's no client-side-only gating to bypass.
 */
export async function ModuleGate({
  tenantId,
  moduleKey,
  children,
}: {
  tenantId: string;
  moduleKey: ModuleKey;
  children: React.ReactNode;
}) {
  const allowed = await hasModule(tenantId, moduleKey);
  if (allowed) return <>{children}</>;

  const requiredTiers = (Object.entries(PLAN_TIERS) as [string, (typeof PLAN_TIERS)[keyof typeof PLAN_TIERS]][])
    .filter(([, def]) => def.modules.includes(moduleKey))
    .map(([, def]) => def.name);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm">
        <h1 className="mb-2 text-lg font-semibold text-amber-900">Not included in your plan</h1>
        <p className="text-amber-800">
          This module requires the {requiredTiers.join(" or ")} plan. Ask an Owner to upgrade at{" "}
          <a href="/settings" className="font-medium underline">
            Settings
          </a>
          .
        </p>
      </div>
    </main>
  );
}
