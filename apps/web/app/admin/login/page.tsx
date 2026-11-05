import { AdminLoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-800 p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-white">Platform admin</h1>
        <p className="mb-6 text-sm text-slate-400">Internal staff only.</p>
        <AdminLoginForm />
      </div>
    </main>
  );
}
