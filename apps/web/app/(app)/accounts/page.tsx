import { listAccounts, getTrialBalance } from "@erp/core/accounting";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { WalletIcon } from "@/components/icons";
import { AccountsClient } from "./accounts-client";

export default async function AccountsPage() {
  const { tenantId, userId } = await requireSession();
  const [accounts, balances, canManage] = await Promise.all([
    listAccounts(tenantId),
    getTrialBalance(tenantId),
    can(userId, PERMISSIONS.ACCOUNT_MANAGE),
  ]);

  const balanceByCode = new Map(balances.map((b) => [b.accountCode, Number(b.balance)]));

  const rows = accounts.map((a) => ({
    id: a.id,
    code: a.code,
    name: a.name,
    type: a.type,
    isSystemAccount: a.isSystemAccount,
    balance: balanceByCode.get(a.code) ?? 0,
  }));

  return (
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader
        title="Chart of accounts"
        description="The ledger accounts that record every transaction in the system."
        icon={<WalletIcon className="h-5 w-5" />}
      />

      <AccountsClient accounts={rows} canManage={canManage} />
    </main>
  );
}
