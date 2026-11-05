import { listPayablesAging } from "@erp/core/purchasing";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";

const BUCKET_LABELS: Record<string, string> = {
  current: "Current",
  "1-30": "1–30 days",
  "31-60": "31–60 days",
  "61-90": "61–90 days",
  "90+": "90+ days",
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
      <h1 className="mb-4 text-xl font-semibold">Payables aging</h1>

      <div className="mb-6 grid grid-cols-5 gap-3">
        {Object.entries(BUCKET_LABELS).map(([bucket, label]) => (
          <div key={bucket} className="rounded-lg border border-slate-200 bg-white p-3 text-center">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-lg font-semibold">{totalsByBucket[bucket]?.toFixed(2) ?? "0.00"}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Invoice</th>
              <th className="px-4 py-2">Supplier</th>
              <th className="px-4 py-2">Due date</th>
              <th className="px-4 py-2 text-right">Amount due</th>
              <th className="px-4 py-2">Bucket</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.invoiceId} className="border-t border-slate-100">
                <td className="px-4 py-2">{r.docNumber}</td>
                <td className="px-4 py-2">{r.supplierName}</td>
                <td className="px-4 py-2">{r.dueDate}</td>
                <td className="px-4 py-2 text-right">{r.amountDue}</td>
                <td className="px-4 py-2">{BUCKET_LABELS[r.bucket]}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No outstanding payables.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
    </ModuleGate>
  );
}
