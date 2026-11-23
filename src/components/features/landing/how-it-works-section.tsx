const steps = [
  {
    step: "01",
    title: "Initiate",
    description: "Choose a recipient, account, and amount. The interface validates required fields before submission.",
    detail: "Input validation · Sample data",
  },
  {
    step: "02",
    title: "Verify",
    description: "Server-side checks confirm permissions, account status, and available balance before any ledger change.",
    detail: "Authorization · Balance checks",
  },
  {
    step: "03",
    title: "Authorize",
    description: "Sensitive actions require appropriate authentication and role permissions before processing.",
    detail: "Role-aware controls",
  },
  {
    step: "04",
    title: "Settle",
    description: "The transfer is recorded as a complete transaction outcome, avoiding partial balance updates.",
    detail: "Atomic ledger write",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-landing-bg py-20 scroll-mt-28" aria-labelledby="how-it-works-heading">
      <div className="landing-container">
        <div className="max-w-3xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-landing-primary">Transfer Journey</p>
          <h2 id="how-it-works-heading" className="mt-3 font-heading text-3xl font-semibold tracking-tight text-landing-ink sm:text-4xl">
            How a transfer moves through NexaBank
          </h2>
          <p className="mt-4 text-base leading-7 text-landing-muted">
            A clear, step-by-step flow designed for transparency. Example values below are sample data for demonstration only.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((item) => (
            <article key={item.step} className="rounded-[12px] border border-landing-border bg-landing-surface p-5">
              <div className="inline-flex size-10 items-center justify-center rounded-full bg-landing-primary-soft font-mono text-sm font-semibold text-landing-primary">
                {item.step}
              </div>
              <h3 className="mt-4 font-heading text-xl font-semibold text-landing-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-landing-muted">{item.description}</p>
              <p className="mt-4 rounded-[8px] bg-landing-surface-low px-3 py-2 font-mono text-xs text-landing-muted">{item.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
