import { Eye, FileLock2, KeyRound, Lock, ShieldCheck, UserCheck, Wallet, History } from "lucide-react";

const items = [
  { icon: ShieldCheck, title: "Atomic Transfers", description: "Transfer operations are designed to complete fully or not at all, preventing partial balance updates." },
  { icon: Wallet, title: "Server Balance Validation", description: "Balance checks are performed server-side before sensitive transaction operations are committed." },
  { icon: KeyRound, title: "Protected Sensitive Actions", description: "Sensitive operations require appropriate authentication and authorization controls." },
  { icon: UserCheck, title: "Role-Based Authorization", description: "Customer, staff, and admin capabilities are separated by role-based access controls." },
  { icon: Lock, title: "Concurrency Safety", description: "Transaction workflows are designed to reduce race conditions during concurrent operations." },
  { icon: Eye, title: "Operational Visibility", description: "Administrative and review interfaces provide visibility into pending and processed activity." },
  { icon: History, title: "Audit-Oriented Records", description: "Important actions can be tracked through audit and transaction records where implemented." },
  { icon: FileLock2, title: "Data Handling Discipline", description: "The interface avoids exposing unnecessary sensitive data and uses clear simulated-data boundaries." },
];

export function SecuritySection() {
  return (
    <section id="security" className="bg-landing-surface-low py-24 sm:py-28 lg:py-32 scroll-mt-28" aria-labelledby="security-heading">
      <div className="landing-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-landing-primary">Zero Compromise</p>
          <h2 id="security-heading" className="mt-3 font-heading text-3xl font-semibold tracking-tight text-landing-ink sm:text-4xl">
            Security &amp; data integrity
          </h2>
          <p className="mt-4 text-base leading-7 text-landing-muted">
            Practical controls and careful workflow design support trustworthy banking simulations.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-[12px] border border-landing-border bg-landing-surface p-5">
                <Icon className="size-5 text-landing-primary" aria-hidden="true" />
                <h3 className="mt-4 text-base font-semibold text-landing-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-landing-muted">{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
