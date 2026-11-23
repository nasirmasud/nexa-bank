import { ArrowRightLeft, CreditCard, Landmark, ReceiptText } from "lucide-react";

const features = [
  {
    icon: ArrowRightLeft,
    title: "Own-Account Transfers",
    description: "Move funds between your own accounts with clear status tracking and sample transaction records.",
  },
  {
    icon: Landmark,
    title: "Deposit & Withdrawal Requests",
    description: "Create and track deposit and withdrawal requests through role-based review workflows.",
  },
  {
    icon: CreditCard,
    title: "Loan Lifecycle Visibility",
    description: "Apply for loans, review decisions, and track repayment progress from dedicated dashboards.",
  },
  {
    icon: ReceiptText,
    title: "Transaction History",
    description: "Review deposits, withdrawals, transfers, loan disbursements, and loan repayments in one place.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-landing-surface-low py-24 sm:py-28 lg:py-32 scroll-mt-28" aria-labelledby="features-heading">
      <div className="landing-container grid gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-landing-primary">Client Infrastructure</p>
          <h2 id="features-heading" className="mt-3 font-heading text-3xl font-semibold tracking-tight text-landing-ink sm:text-4xl">
            Banking features built for clarity
          </h2>
          <p className="mt-4 text-base leading-7 text-landing-muted">
            NexaBank brings core banking workflows into a calm, role-aware interface. Every figure in previews is illustrative sample data.
          </p>
          <div className="mt-6 rounded-[12px] border border-landing-border bg-landing-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-landing-muted">Supported transaction types</p>
            <p className="mt-2 text-sm leading-6 text-landing-ink">Deposit, Withdrawal, Transfer, Loan Disbursement, Loan Repayment</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-[12px] border border-landing-border bg-landing-surface p-5 shadow-sm">
                <div className="inline-flex size-11 items-center justify-center rounded-[12px] bg-landing-primary-soft text-landing-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-heading text-xl font-semibold text-landing-ink">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-landing-muted">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
