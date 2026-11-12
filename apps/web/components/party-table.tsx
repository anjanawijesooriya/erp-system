import { Card, EmptyState } from "@erp/ui/card";
import { UsersIcon } from "./icons";

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
  if (parties.length === 0) {
    return (
      <Card>
        <EmptyState icon={<UsersIcon className="h-5 w-5" />} title={emptyLabel} description="Add one using the form above." />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
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
            <tr key={p.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
              <td className="px-4 py-2 text-slate-500">{p.code ?? "—"}</td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="font-medium text-slate-900">{p.name}</span>
                </div>
              </td>
              <td className="px-4 py-2 text-slate-600">{p.phone ?? "—"}</td>
              <td className="px-4 py-2 text-slate-600">{p.email ?? "—"}</td>
              <td className="px-4 py-2 text-right text-slate-600">{p.creditLimit}</td>
              <td className="px-4 py-2 text-right text-slate-600">{p.creditTermDays}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
