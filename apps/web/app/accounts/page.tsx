import { listAccounts } from "@erp/core/accounting";
import { requireSession } from "@/lib/session";
import { AppNav } from "@/components/app-nav";

export default async function AccountsPage() {
  const { tenantId } = await requireSession();
  const accounts = await listAccounts(tenantId);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <AppNav />
      <h1 className="mb-1 text-xl font-semibold">Chart of Accounts</h1>
      <p className="mb-4 text-sm text-slate-500">
        Seeded from your business type at onboarding. Manual journals and automatic posting land
        in Phase 6.
      </p>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">System</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{a.code}</td>
                <td className="px-4 py-2">{a.name}</td>
                <td className="px-4 py-2 capitalize">{a.type}</td>
                <td className="px-4 py-2">{a.isSystemAccount ? "Yes" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
