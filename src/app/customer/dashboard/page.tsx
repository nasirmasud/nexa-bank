import { requireRole } from "@/lib/guards";

export default async function CustomerDashboard() {
  await requireRole("CUSTOMER");
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Customer Dashboard</h1>
      <p className="mt-2 text-slate-600">Balances, recent transactions, charts, and active loans will appear here.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["Total Balance", "Deposits", "Withdrawals", "Active Loans"].map((label) => (
          <div key={label} className="rounded-xl border bg-white p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold">—</p>
          </div>
        ))}
      </div>
    </main>
  );
}
