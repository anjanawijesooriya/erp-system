type Party = {
  id: string;
  code: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  creditLimit: string;
  creditTermDays: number;
};

export function PartyTable({ parties, emptyLabel }: { parties: Party[]; emptyLabel: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-2">Code</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Phone</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2 text-right">Credit limit</th>
            <th className="px-4 py-2 text-right">Terms (days)</th>
          </tr>
        </thead>
        <tbody>
          {parties.map((p) => (
            <tr key={p.id} className="border-t border-slate-100">
              <td className="px-4 py-2">{p.code ?? "—"}</td>
              <td className="px-4 py-2">{p.name}</td>
              <td className="px-4 py-2">{p.phone ?? "—"}</td>
              <td className="px-4 py-2">{p.email ?? "—"}</td>
              <td className="px-4 py-2 text-right">{p.creditLimit}</td>
              <td className="px-4 py-2 text-right">{p.creditTermDays}</td>
            </tr>
          ))}
          {parties.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                {emptyLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
