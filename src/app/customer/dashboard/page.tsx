import { requireRole } from "@/lib/guards";

export default async function CustomerDashboard() {
  await requireRole("CUSTOMER");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Customer Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Balances, recent transactions, charts, and active loans will appear here.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["Total Balance", "Deposits", "Withdrawals", "Active Loans"].map((label) => (
          <div key={label} className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 font-heading text-2xl font-semibold">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
