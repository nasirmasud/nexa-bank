const stats = [
  { value: "3 roles", label: "Customer, Staff & Admin workspaces" },
  { value: "5 transaction types", label: "Deposit, Withdrawal, Transfer, Loan Disbursement, Loan Repayment" },
  { value: "Server-side controls", label: "Role and ownership checks on protected operations" },
  { value: "Atomic transfers", label: "Dual-entry balance updates designed to avoid partial transfers" },
];

export function StatsSection() {
  return (
    <section className="border-y border-landing-border bg-landing-surface-low py-12 sm:py-14" aria-labelledby="stats-heading">
      <div className="landing-container">
        <h2 id="stats-heading" className="sr-only">
          Platform highlights
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.value} className="rounded-[12px] border border-landing-border bg-landing-surface p-5">
              <p className="font-heading text-2xl font-semibold tracking-tight text-landing-primary">{stat.value}</p>
              <p className="mt-2 text-sm leading-6 text-landing-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
