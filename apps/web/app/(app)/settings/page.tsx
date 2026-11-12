import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { tenants } from "@erp/db/schema";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { getSubscription } from "@erp/core/plans";
import { PageHeader, Card } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { SettingsForm } from "./settings-form";
import {
  CogIcon,
  ReceiptIcon,
  UsersIcon,
  BuildingIcon,
  WalletIcon,
} from "@/components/icons";

export default async function SettingsPage() {
  const { tenantId, userId } = await requireSession();
  const [tenant, canManage, canManageUsers, subscription] = await Promise.all([
    db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) }),
    can(userId, PERMISSIONS.TENANT_SETTINGS_MANAGE),
    can(userId, PERMISSIONS.USER_MANAGE),
    getSubscription(tenantId),
  ]);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader
        title="Settings"
        description="Manage your business profile, documents, and who has access."
        icon={<CogIcon className="h-5 w-5" />}
      />

      {!canManage ? (
        <p className="text-sm text-slate-500">You don&apos;t have permission to change settings.</p>
      ) : (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3.5">
            <span className="border-l-[3px] border-brand-700 pl-2.5 text-xs font-bold uppercase tracking-wide text-slate-400">
              Business profile
            </span>
            <Card className="p-4 text-sm">
              <div className="mb-1 font-medium text-slate-900">Plan</div>
              <p className="text-slate-600">
                {subscription?.plan ? subscription.plan.toUpperCase() : "POS"} · {subscription?.status ?? "trialing"}
              </p>
            </Card>
            <SettingsForm currentPhone={tenant?.ownerPhone ?? null} />
          </section>

          <section className="flex flex-col gap-3.5">
            <span className="border-l-[3px] border-warning-600 pl-2.5 text-xs font-bold uppercase tracking-wide text-slate-400">
              Documents &amp; workspace
            </span>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SettingsCard
                icon={<ReceiptIcon className="h-5 w-5" />}
                iconBg="bg-info-50"
                iconText="text-info-700"
                title="Invoice branding"
                description="Logo, accent color, and letterhead details applied to every printed sales invoice."
                href="/settings/invoice-branding"
              />
              <SettingsCard
                icon={<BuildingIcon className="h-5 w-5" />}
                iconBg="bg-success-50"
                iconText="text-success-700"
                title="Warehouses & branches"
                description="Physical locations stock is held at and where sales are recorded."
                href="/warehouses"
              />
              {canManageUsers && (
                <SettingsCard
                  icon={<UsersIcon className="h-5 w-5" />}
                  iconBg="bg-brand-50"
                  iconText="text-brand-700"
                  title="Staff & roles"
                  description="Who can sign in, which branches they can access, and what they're allowed to do."
                  href="/users"
                />
              )}
              <SettingsCard
                icon={<WalletIcon className="h-5 w-5" />}
                iconBg="bg-warning-50"
                iconText="text-warning-700"
                title="Linked accountants"
                description="External accountants with read-only access to your books."
                href="/settings/accountants"
              />
            </div>
          </section>

          <section className="flex flex-col gap-3.5">
            <span className="border-l-[3px] border-success-600 pl-2.5 text-xs font-bold uppercase tracking-wide text-slate-400">
              Data
            </span>
            <Card className="p-4 text-sm">
              <div className="mb-1 font-medium text-slate-900">Export your data</div>
              <p className="mb-3 text-slate-600">
                Download a JSON snapshot of your tenant&apos;s master data and transaction headlines.
              </p>
              <a
                href="/api/export-data"
                className="inline-block rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Download export
              </a>
            </Card>
          </section>
        </div>
      )}
    </main>
  );
}

function SettingsCard({
  icon,
  iconBg,
  iconText,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconText: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Card className="flex flex-col gap-3.5 p-5">
      <span className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${iconBg} ${iconText}`}>{icon}</span>
      <div>
        <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{description}</p>
      </div>
      <Link
        href={href}
        className="mt-1 flex h-10 items-center justify-center gap-1.5 rounded-lg bg-brand-700 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
      >
        Manage settings →
      </Link>
    </Card>
  );
}
