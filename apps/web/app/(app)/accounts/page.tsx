import { listAccounts } from "@erp/core/accounting";
import { requireSession } from "@/lib/session";

export default async function AccountsPage() {
  const { tenantId } = await requireSession();
  const accounts = await listAccounts(tenantId);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Chart of Accounts</h1>
      <p className="mb-4 text-sm text-slate-500">
        Seeded from your business type at onboarding. Manual journals and automatic posting land
        in Phase 6.
      </p>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Code</th>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">System</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-4 py-2.5">{a.code}</td>
                <td className="px-4 py-2.5">{a.name}</td>
                <td className="px-4 py-2.5 capitalize">{a.type}</td>
                <td className="px-4 py-2.5">{a.isSystemAccount ? "Yes" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
