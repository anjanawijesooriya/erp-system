import { eq, sql } from "drizzle-orm";
import { db } from "@erp/db";
import { auditLogs, branches, products, subscriptions, tenants, users } from "@erp/db/schema";

export interface TenantOverviewRow {
  id: string;
  name: string;
  slug: string;
  businessType: string | null;
  isActive: boolean;
  plan: string | null;
  subscriptionStatus: string | null;
  branchCount: number;
  userCount: number;
  productCount: number;
}

/** Cross-tenant — only for the super-admin panel, never exposed to a tenant session. */
export async function listTenantsWithUsage(): Promise<TenantOverviewRow[]> {
  const rows = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      businessType: tenants.businessType,
      isActive: tenants.isActive,
      plan: subscriptions.plan,
      subscriptionStatus: subscriptions.status,
      branchCount: sql<number>`(select count(*) from ${branches} where ${branches.tenantId} = ${tenants.id})`,
      userCount: sql<number>`(select count(*) from ${users} where ${users.tenantId} = ${tenants.id})`,
      productCount: sql<number>`(select count(*) from ${products} where ${products.tenantId} = ${tenants.id})`,
    })
    .from(tenants)
    .leftJoin(subscriptions, eq(subscriptions.tenantId, tenants.id))
    .orderBy(tenants.name);

  return rows;
}

/**
 * "Support impersonation" per the build plan, simplified: logs an
 * audit-trailed admin access event rather than forging a real tenant user
 * session (session-swapping safely is a larger, security-sensitive piece
 * left for a follow-up). The admin then views tenant data through the
 * super-admin panel's own read-only pages, not by becoming a tenant user.
 */
export async function logAdminTenantAccess(adminId: string, adminEmail: string, tenantId: string) {
  await db.insert(auditLogs).values({
    tenantId,
    userId: null,
    action: "platform_admin.tenant.view",
    entityType: "tenant",
    entityId: tenantId,
    after: { adminId, adminEmail },
  });
}
