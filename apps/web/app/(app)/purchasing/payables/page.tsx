import { listPayablesAging } from "@erp/core/purchasing";
import { PageHeader, StatTile } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { WalletIcon } from "@/components/icons";
import { PayablesClient } from "./payables-client";

const BUCKET_LABELS: Record<string, string> = {
  current: "Current",
  "1-30": "1–30 days",
  "31-60": "31–60 days",
  "61-90": "61–90 days",
  "90+": "90+ days",
};

const BUCKET_TONE: Record<string, "default" | "accent" | "amber" | "rose"> = {
  current: "accent",
  "1-30": "amber",
  "31-60": "amber",
  "61-90": "rose",
  "90+": "rose",
};

export default async function PayablesAgingPage() {
  const { tenantId } = await requireSession();
  const rows = await listPayablesAging(tenantId);

  const totalsByBucket = Object.fromEntries(
    Object.keys(BUCKET_LABELS).map((bucket) => [
      bucket,
      rows.filter((r) => r.bucket === bucket).reduce((sum, r) => sum + Number(r.amountDue), 0),
    ]),
  );

  return (
    <ModuleGate tenantId={tenantId} moduleKey="purchasing">
    <main className="mx-auto max-w-6xl p-8">
      <PageHeader
        title="Payables aging"
        description="What's owed to suppliers, grouped by how overdue it is."
        icon={<WalletIcon className="h-5 w-5" />}
      />

      <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        <StatTile
          label="Total payable"
          value={rows.reduce((sum, r) => sum + Number(r.amountDue), 0).toFixed(2)}
          tone="rose"
        />
        {Object.entries(BUCKET_LABELS).map(([bucket, label]) => (
          <StatTile key={bucket} label={label} value={(totalsByBucket[bucket] ?? 0).toFixed(2)} tone={BUCKET_TONE[bucket]} />
        ))}
      </div>

      <PayablesClient rows={rows} />
    </main>
    </ModuleGate>
  );
}
