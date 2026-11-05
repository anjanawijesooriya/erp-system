import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { subscriptions } from "@erp/db/schema";
import type { PlanTier } from "./plan-tiers";
import type { DbTx } from "../tenant-context";

export async function getSubscription(tenantId: string) {
  return db.query.subscriptions.findFirst({ where: eq(subscriptions.tenantId, tenantId) });
}

/**
 * Every tenant should have exactly one subscription row — created at
 * onboarding, defaulting to the POS tier. Pass `tx` to run inside a
 * larger transaction (e.g. tenant onboarding).
 */
export async function createSubscription(tenantId: string, plan: PlanTier = "pos", tx?: DbTx) {
  const executor = tx ?? db;
  const [row] = await executor
    .insert(subscriptions)
    .values({ tenantId, plan, status: "trialing" })
    .onConflictDoNothing()
    .returning();
  return row;
}

export async function setPlan(tenantId: string, plan: PlanTier) {
  const [row] = await db
    .update(subscriptions)
    .set({ plan, updatedAt: new Date() })
    .where(eq(subscriptions.tenantId, tenantId))
    .returning();
  return row;
}

/** Tenants without a subscription row (shouldn't normally happen) default to the most restrictive tier. */
export async function getPlanTier(tenantId: string): Promise<PlanTier> {
  const sub = await getSubscription(tenantId);
  return (sub?.plan as PlanTier) ?? "pos";
}
