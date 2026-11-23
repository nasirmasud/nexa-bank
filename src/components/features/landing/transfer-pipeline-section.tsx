const stages = [
  { stage: "Stage 1", title: "Request Ingest", description: "Transfer request is received and validated." },
  { stage: "Stage 2", title: "Identity & Role Check", description: "User role and permissions are verified server-side." },
  { stage: "Stage 3", title: "Balance Verification", description: "Available funds and account constraints are checked." },
  { stage: "Stage 4", title: "Ledger Lock", description: "Relevant records are protected during the transaction." },
  { stage: "Stage 5", title: "Atomic Commit", description: "Debit and credit are committed as one outcome." },
  { stage: "Stage 6", title: "Confirmation", description: "Transaction status and notifications are recorded." },
];

export function TransferPipelineSection() {
  return (
    <section className="bg-landing-bg py-20 scroll-mt-28" aria-labelledby="pipeline-heading">
      <div className="landing-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-landing-primary">Resilience Invariant</p>
          <h2 id="pipeline-heading" className="mt-3 font-heading text-3xl font-semibold tracking-tight text-landing-ink sm:text-4xl">
            How a transfer stays safe
          </h2>
          <p className="mt-4 text-base leading-7 text-landing-muted">
            A structured transfer pipeline helps keep account balances consistent. Diagram is illustrative sample data.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stages.map((item) => (
            <article key={item.stage} className="rounded-[12px] border border-landing-border bg-landing-surface p-5">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-landing-primary">{item.stage}</p>
              <h3 className="mt-3 font-heading text-xl font-semibold text-landing-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-landing-muted">{item.description}</p>
            </article>
          ))}
        </div>
        <div className="mt-6 rounded-[12px] border border-landing-warning/30 bg-landing-warning/10 p-4 text-sm text-landing-ink">
          <span className="font-semibold">Rollback behavior:</span> if any stage fails, the transaction should be rolled back so no partial transfer is persisted.
        </div>
      </div>
    </section>
  );
}
