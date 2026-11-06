import { listIssues } from "@erp/core/pilot";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { getBranchOptions } from "@/lib/branch-options";
import { ReportIssueForm } from "./report-form";
import { StatusSelect } from "./status-select";

const SEVERITY_COLORS: Record<string, string> = {
  low: "text-slate-500",
  medium: "text-amber-600",
  high: "text-orange-600",
  critical: "text-red-600 font-semibold",
};

export default async function IssuesPage() {
  const { tenantId, userId } = await requireSession();
  const [issues, branches, canReport, canManage] = await Promise.all([
    listIssues(tenantId),
    getBranchOptions(tenantId),
    can(userId, PERMISSIONS.ISSUE_REPORT),
    can(userId, PERMISSIONS.ISSUE_MANAGE),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Issues</h1>

      {canReport && (
        <div className="mb-6">
          <ReportIssueForm branches={branches} />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Severity</th>
              <th className="px-4 py-2.5">Reported by</th>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((i) => (
              <tr key={i.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-2.5">
                  <div className="font-medium">{i.title}</div>
                  {i.description && <div className="text-xs text-slate-500">{i.description}</div>}
                </td>
                <td className={`px-4 py-2 capitalize ${SEVERITY_COLORS[i.severity]}`}>{i.severity}</td>
                <td className="px-4 py-2.5">{i.reportedBy?.name}</td>
                <td className="px-4 py-2.5">{new Date(i.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2.5">
                  {canManage ? (
                    <StatusSelect issueId={i.id} status={i.status} />
                  ) : (
                    <span className="capitalize">{i.status.replace("_", " ")}</span>
                  )}
                </td>
              </tr>
            ))}
            {issues.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No issues reported.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
