import { db } from "@erp/db";
import { ledgerAccounts } from "@erp/db/schema";
import { getChartOfAccountsTemplate } from "./chart-of-accounts-templates";
import type { DbTx } from "../tenant-context";

/**
 * Creates the tenant's chart of accounts from the business-type template.
 * Run once at tenant onboarding. Safe to call again — existing codes are
 * left untouched (onConflictDoNothing), so it never overwrites a tenant's
 * own edits.
 *
 * Pass `tx` when calling this from inside a larger onboarding transaction
 * (see tenants/onboarding.ts) so the whole signup is atomic; omit it to
 * run standalone (wraps its own transaction) — used by the demo seed script.
 */
export async function seedChartOfAccounts(
  tenantId: string,
  businessType?: string | null,
  tx?: DbTx,
): Promise<void> {
  const template = getChartOfAccountsTemplate(businessType);

  const run = async (executor: DbTx) => {
    const codeToId = new Map<string, string>();

    // Parents must exist before children reference them, and the template
    // above always lists a parent before its children.
    for (const entry of template) {
      const [row] = await executor
        .insert(ledgerAccounts)
        .values({
          tenantId,
          code: entry.code,
          name: entry.name,
          type: entry.type,
          isSystemAccount: entry.isSystemAccount ?? false,
          parentAccountId: entry.parentCode ? codeToId.get(entry.parentCode) : undefined,
        })
        .onConflictDoNothing()
        .returning({ id: ledgerAccounts.id });

      if (row) {
        codeToId.set(entry.code, row.id);
      }
    }
  };

  if (tx) {
    await run(tx);
  } else {
    await db.transaction(run);
  }
}
