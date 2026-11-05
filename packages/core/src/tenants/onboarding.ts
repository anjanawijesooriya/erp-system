import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@erp/db";
import { branches, tenants, userRoles, users } from "@erp/db/schema";
import { seedGlobalPermissions, seedSystemRolesForTenant } from "../rbac/seed-tenant-roles";
import { seedChartOfAccounts } from "../accounting/seed-chart-of-accounts";
import { createSubscription } from "../plans/subscriptions";

export const onboardingInput = z.object({
  shopName: z.string().min(1).max(200),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Shop slug can only contain lowercase letters, numbers and hyphens"),
  businessType: z.enum(["hardware", "pharmacy", "grocery", "textile", "wholesale"]).optional(),
  ownerName: z.string().min(1).max(200),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(8, "Password must be at least 8 characters"),
});
export type OnboardingInput = z.infer<typeof onboardingInput>;

export class SlugTakenError extends Error {
  constructor(slug: string) {
    super(`Shop slug "${slug}" is already taken`);
    this.name = "SlugTakenError";
  }
}

/**
 * Self-service tenant signup (build-plan "Operational SaaS needs": signup
 * wizard). Creates the tenant, a Head Office branch, a trialing POS-tier
 * subscription, the four system roles with permissions, the chart of
 * accounts for the chosen business type, and the owner's own login — all
 * in one transaction, so a failure partway through leaves nothing behind.
 */
export async function onboardTenant(input: OnboardingInput) {
  const existing = await db.query.tenants.findFirst({ where: eq(tenants.slug, input.slug) });
  if (existing) throw new SlugTakenError(input.slug);

  await seedGlobalPermissions();
  const passwordHash = await bcrypt.hash(input.ownerPassword, 10);

  return db.transaction(async (tx) => {
    const [tenant] = await tx
      .insert(tenants)
      .values({ name: input.shopName, slug: input.slug, businessType: input.businessType })
      .returning();
    if (!tenant) throw new Error("Failed to create tenant");

    await tx.insert(branches).values({
      tenantId: tenant.id,
      name: "Head Office",
      code: "HO",
      isHeadOffice: true,
    });

    await createSubscription(tenant.id, "pos", tx);

    const roleIdByName = await seedSystemRolesForTenant(tenant.id, tx);
    const ownerRoleId = roleIdByName.Owner;
    if (!ownerRoleId) throw new Error("Failed to seed Owner role");

    const [owner] = await tx
      .insert(users)
      .values({
        tenantId: tenant.id,
        name: input.ownerName,
        email: input.ownerEmail,
        passwordHash,
      })
      .returning();
    if (!owner) throw new Error("Failed to create owner user");

    await tx.insert(userRoles).values({ userId: owner.id, roleId: ownerRoleId });

    await seedChartOfAccounts(tenant.id, input.businessType, tx);

    return { tenant, owner };
  });
}
