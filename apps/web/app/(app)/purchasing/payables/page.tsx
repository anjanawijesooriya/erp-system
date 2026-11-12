import { listPayablesAging } from "@erp/core/purchasing";
import { PageHeader, Card, EmptyState, StatTile } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { WalletIcon } from "@/components/icons";

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
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader
        title="Payables aging"
        description="What's owed to suppliers, grouped by how overdue it is."
        icon={<WalletIcon className="h-5 w-5" />}
      />

      <div className="mb-6 grid grid-cols-5 gap-3">
        {Object.entries(BUCKET_LABELS).map(([bucket, label]) => (
          <StatTile key={bucket} label={label} value={(totalsByBucket[bucket] ?? 0).toFixed(2)} tone={BUCKET_TONE[bucket]} />
        ))}
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={<WalletIcon className="h-5 w-5" />} title="No outstanding payables." description="Everything owed to suppliers is settled." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Invoice</th>
                <th className="px-4 py-2.5">Supplier</th>
                <th className="px-4 py-2.5">Due date</th>
                <th className="px-4 py-2.5 text-right">Amount due</th>
                <th className="px-4 py-2.5">Bucket</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.invoiceId} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 font-medium text-slate-900">{r.docNumber}</td>
                  <td className="px-4 py-2.5 text-slate-600">{r.supplierName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{r.dueDate}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{r.amountDue}</td>
                  <td className="px-4 py-2.5">{BUCKET_LABELS[r.bucket]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </main>
    </ModuleGate>
  );
}
