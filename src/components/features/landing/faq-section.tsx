const faqs = [
  {
    q: "Is real currency exchanged anywhere on this simulator?",
    a: "No. NexaBank is a simulated banking platform for demonstration and learning. No real fiat money, bank rails, or credit instruments are connected to these accounts.",
  },
  {
    q: "How does NexaBank prevent partial transfers and race conditions?",
    a: "Transfer workflows are designed to use server-side validation and atomic transaction behavior. If any step fails, the operation should roll back rather than persist a partial transfer.",
  },
  {
    q: "What transaction types are supported?",
    a: "The platform supports Deposit, Withdrawal, Transfer, Loan Disbursement, and Loan Repayment.",
  },
  {
    q: "Can I use these demo credentials in production?",
    a: "No. Demo credentials are for the simulated environment only. Do not enter real personal or banking data.",
  },
  {
    q: "Why do some dashboards show balances and charts?",
    a: "Those figures are illustrative sample data used to demonstrate the interface and workflows.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="bg-landing-surface-low py-20 scroll-mt-28" aria-labelledby="faq-heading">
      <div className="landing-container max-w-4xl">
        <div className="text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-landing-primary">Inquiries</p>
          <h2 id="faq-heading" className="mt-3 font-heading text-3xl font-semibold tracking-tight text-landing-ink sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>
        <div className="mt-10 space-y-3">
          {faqs.map((item) => (
            <details key={item.q} className="group rounded-[12px] border border-landing-border bg-landing-surface p-5">
              <summary className="cursor-pointer list-none pr-8 font-semibold text-landing-ink marker:content-none">
                <span className="flex items-center justify-between gap-4">
                  <span>{item.q}</span>
                  <span className="text-landing-primary transition group-open:rotate-45" aria-hidden="true">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-landing-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
