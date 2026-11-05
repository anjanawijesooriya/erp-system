import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { branches, tenants, userRoles, users } from "@erp/db/schema";
import { seedGlobalPermissions, seedSystemRolesForTenant } from "./rbac/seed-tenant-roles";
import { seedChartOfAccounts } from "./accounting/seed-chart-of-accounts";
import { createSubscription } from "./plans/subscriptions";

async function main() {
  console.log("Seeding permissions...");
  await seedGlobalPermissions();

  console.log("Seeding demo tenant...");
  const [tenant] = await db
    .insert(tenants)
    .values({ name: "Demo Hardware Shop", slug: "demo-hardware", businessType: "hardware" })
    .onConflictDoNothing()
    .returning();

  const demoTenant =
    tenant ?? (await db.query.tenants.findFirst({ where: eq(tenants.slug, "demo-hardware") }));
  if (!demoTenant) throw new Error("Could not create or find demo tenant");

  const [insertedBranch] = await db
    .insert(branches)
    .values({ tenantId: demoTenant.id, name: "Head Office", code: "HO", isHeadOffice: true })
    .onConflictDoNothing()
    .returning();
  const branch =
    insertedBranch ??
    (await db.query.branches.findFirst({
      where: (b, { and: andOp, eq: eqOp }) => andOp(eqOp(b.tenantId, demoTenant.id), eqOp(b.code, "HO")),
    }));

  console.log("Seeding subscription...");
  await createSubscription(demoTenant.id, "erp"); // demo tenant gets the full tier so every module is visible

  console.log("Seeding system roles for demo tenant...");
  const roleIdByName = await seedSystemRolesForTenant(demoTenant.id);

  const ownerRoleId = roleIdByName.Owner;
  if (ownerRoleId) {
    console.log("Seeding owner user (owner@demo.shop / ChangeMe123!)...");
    const passwordHash = await bcrypt.hash("ChangeMe123!", 10);
    const [owner] = await db
      .insert(users)
      .values({ tenantId: demoTenant.id, name: "Demo Owner", email: "owner@demo.shop", passwordHash })
      .onConflictDoNothing()
      .returning();

    if (owner) {
      await db.insert(userRoles).values({ userId: owner.id, roleId: ownerRoleId }).onConflictDoNothing();
    }
  }

  console.log("Seeding chart of accounts...");
  await seedChartOfAccounts(demoTenant.id, demoTenant.businessType);

  console.log("Seed complete.");
  console.log(`Tenant: ${demoTenant.slug} | Branch: ${branch?.code ?? "HO"} | Login: owner@demo.shop / ChangeMe123!`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
