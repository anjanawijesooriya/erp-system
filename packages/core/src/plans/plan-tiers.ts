export type PlanTier = "pos" | "business" | "erp";

/** A coarse module key gating whole feature areas — checked at the top of a page/action, not per-permission. */
export type ModuleKey =
  | "sales"
  | "pos"
  | "inventory"
  | "purchasing"
  | "accounting"
  | "payroll"
  | "manufacturing"
  | "ecommerce"
  | "accountant_portal";

export interface PlanLimits {
  maxBranches: number;
  maxUsers: number;
  maxProducts: number;
}

export interface PlanDefinition {
  name: string;
  modules: ModuleKey[];
  limits: PlanLimits;
}

/**
 * The three tiers from the build plan's "Plans and feature flags" table.
 * `Infinity` means uncapped. Upgrading never requires a migration — a
 * tenant's `subscriptions.plan` is just read fresh on each check.
 */
export const PLAN_TIERS: Record<PlanTier, PlanDefinition> = {
  pos: {
    name: "POS",
    modules: ["sales", "pos"],
    limits: { maxBranches: 1, maxUsers: 3, maxProducts: 200 },
  },
  business: {
    name: "Business",
    modules: ["sales", "pos", "inventory", "purchasing"],
    limits: { maxBranches: 5, maxUsers: 15, maxProducts: 2000 },
  },
  erp: {
    name: "ERP",
    modules: [
      "sales",
      "pos",
      "inventory",
      "purchasing",
      "accounting",
      "payroll",
      "manufacturing",
      "ecommerce",
      "accountant_portal",
    ],
    limits: { maxBranches: Infinity, maxUsers: Infinity, maxProducts: Infinity },
  },
};
