import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "@erp/db";
import { accountantTenantLinks, accountants, tenants } from "@erp/db/schema";

export async function findAccountantByEmail(email: string) {
  return db.query.accountants.findFirst({ where: eq(accountants.email, email) });
}

export async function verifyAccountantPassword(email: string, password: string) {
  const accountant = await findAccountantByEmail(email);
  if (!accountant) return null;
  const valid = await bcrypt.compare(password, accountant.passwordHash);
  return valid ? accountant : null;
}

/** There's no self-service accountant signup — an account is only ever created by a tenant owner inviting one, below. */
export async function createAccountant(name: string, email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  const [row] = await db.insert(accountants).values({ name, email, passwordHash }).onConflictDoNothing().returning();
  return row ?? (await findAccountantByEmail(email))!;
}

/**
 * The tenant-owner-facing "invite an accountant" flow (see
 * apps/web/app/settings/accountants): creates the accountant's login if
 * this is the first tenant to invite them by this email, or reuses the
 * existing one if another tenant already did — either way, links them
 * to this tenant with the given access level. An accountant never
 * grants themselves access to a company.
 */
export async function inviteAccountantToTenant(
  tenantId: string,
  name: string,
  email: string,
  password: string,
  canPostJournals: boolean,
) {
  const accountant = (await findAccountantByEmail(email)) ?? (await createAccountant(name, email, password));
  return linkAccountantToTenant(tenantId, accountant.email, canPostJournals);
}

/**
 * Only a tenant owner grants this (see apps/web/app/settings/accountants
 * actions), never the accountant themselves — an accountant can't add
 * companies to their own portal.
 */
export async function linkAccountantToTenant(tenantId: string, accountantEmail: string, canPostJournals: boolean) {
  const accountant = await findAccountantByEmail(accountantEmail);
  if (!accountant) throw new Error(`No accountant account exists for ${accountantEmail}`);

  const [row] = await db
    .insert(accountantTenantLinks)
    .values({ accountantId: accountant.id, tenantId, canPostJournals })
    .onConflictDoUpdate({
      target: [accountantTenantLinks.accountantId, accountantTenantLinks.tenantId],
      set: { canPostJournals },
    })
    .returning();
  return row;
}

export async function unlinkAccountantFromTenant(tenantId: string, accountantId: string) {
  await db
    .delete(accountantTenantLinks)
    .where(and(eq(accountantTenantLinks.tenantId, tenantId), eq(accountantTenantLinks.accountantId, accountantId)));
}

export async function listAccountantsForTenant(tenantId: string) {
  return db.query.accountantTenantLinks.findMany({
    where: eq(accountantTenantLinks.tenantId, tenantId),
    with: { accountant: true },
  });
}

/** The companies one logged-in accountant may switch between. */
export async function listTenantsForAccountant(accountantId: string) {
  const links = await db.query.accountantTenantLinks.findMany({
    where: eq(accountantTenantLinks.accountantId, accountantId),
    with: { tenant: true },
  });
  return links.map((l) => ({ tenant: l.tenant, canPostJournals: l.canPostJournals }));
}

/** Guard at the top of any accountant-portal page/action that reads or writes a specific tenant's books. */
export async function assertAccountantHasTenantAccess(accountantId: string, tenantId: string, requirePost = false) {
  const link = await db.query.accountantTenantLinks.findFirst({
    where: and(eq(accountantTenantLinks.accountantId, accountantId), eq(accountantTenantLinks.tenantId, tenantId)),
  });
  if (!link) throw new Error("This accountant does not have access to this company");
  if (requirePost && !link.canPostJournals) throw new Error("This accountant has view-only access to this company");
  return link;
}

export async function getTenantName(tenantId: string) {
  return db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
}
