const bars = [45, 60, 72, 66, 88];

export function AnalyticsPreviewSection() {
  return (
    <section className="bg-landing-surface-low py-20 scroll-mt-28" aria-labelledby="analytics-heading">
      <div className="landing-container grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-landing-primary">Insights</p>
          <h2 id="analytics-heading" className="mt-3 font-heading text-3xl font-semibold tracking-tight text-landing-ink sm:text-4xl">
            Analytics, receipts, and notifications
          </h2>
          <p className="mt-4 text-base leading-7 text-landing-muted">
            Operational visibility across transactions, requests, and account activity. Charts and values below are sample data.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
          <div className="rounded-[12px] border border-landing-border bg-landing-surface p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-landing-ink">Monthly volume</h3>
              <span className="text-[11px] font-medium text-landing-muted">Sample data</span>
            </div>
            <div className="mt-5 flex h-36 items-end gap-2" aria-hidden="true">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 rounded-t-[4px] bg-landing-primary/75" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="rounded-[12px] border border-landing-border bg-landing-surface p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-landing-ink">Recent notifications</h3>
              <span className="text-[11px] font-medium text-landing-muted">Sample data</span>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {[
                "Deposit request approved",
                "Transfer completed successfully",
                "Loan repayment recorded",
              ].map((item) => (
                <div key={item} className="rounded-[8px] bg-landing-surface-low px-3 py-2 text-landing-ink">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
