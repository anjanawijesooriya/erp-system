import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { branches, products, users } from "@erp/db/schema";
import { PLAN_TIERS, type ModuleKey } from "./plan-tiers";
import { getPlanTier } from "./subscriptions";

export class PlanLimitExceededError extends Error {
  constructor(limitName: string, limit: number) {
    super(`Plan limit reached: ${limitName} (max ${limit}). Upgrade the plan to add more.`);
    this.name = "PlanLimitExceededError";
  }
}

export class ModuleNotInPlanError extends Error {
  constructor(moduleKey: ModuleKey) {
    super(`The "${moduleKey}" module isn't included in this tenant's plan. Upgrade to unlock it.`);
    this.name = "ModuleNotInPlanError";
  }
}

export async function hasModule(tenantId: string, moduleKey: ModuleKey): Promise<boolean> {
  const tier = await getPlanTier(tenantId);
  return PLAN_TIERS[tier].modules.includes(moduleKey);
}

/** Use at the top of a page/server action for a plan-gated module (e.g. accounting is ERP-only). */
export async function assertModule(tenantId: string, moduleKey: ModuleKey): Promise<void> {
  if (!(await hasModule(tenantId, moduleKey))) {
    throw new ModuleNotInPlanError(moduleKey);
  }
}

/**
 * Checked at the point of creation (branch/user/product), not continuously
 * — a tenant that downgrades and ends up over a limit keeps their existing
 * records; they just can't create new ones until they're back under it.
 */
export async function assertWithinLimit(
  tenantId: string,
  limitKey: "maxBranches" | "maxUsers" | "maxProducts",
): Promise<void> {
  const tier = await getPlanTier(tenantId);
  const limit = PLAN_TIERS[tier].limits[limitKey];
  if (limit === Infinity) return;

  let current: number;
  if (limitKey === "maxBranches") {
    current = (await db.select().from(branches).where(eq(branches.tenantId, tenantId))).length;
  } else if (limitKey === "maxProducts") {
    current = (await db.select().from(products).where(eq(products.tenantId, tenantId))).length;
  } else {
    current = (await db.select().from(users).where(eq(users.tenantId, tenantId))).length;
  }

  if (current >= limit) {
    throw new PlanLimitExceededError(limitKey, limit);
  }
}
