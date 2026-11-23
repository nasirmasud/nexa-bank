export function DeviceShowcaseSection() {
  return (
    <section className="bg-landing-bg py-20 scroll-mt-28" aria-labelledby="devices-heading">
      <div className="landing-container">
        <div className="max-w-3xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-landing-primary">Responsive by design</p>
          <h2 id="devices-heading" className="mt-3 font-heading text-3xl font-semibold tracking-tight text-landing-ink sm:text-4xl">
            One platform, multiple workspaces
          </h2>
          <p className="mt-4 text-base leading-7 text-landing-muted">
            Desktop and mobile layouts present the same banking workflows with clear hierarchy. Mockups below are sample data.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[12px] border border-landing-border bg-landing-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-landing-ink">Desktop workspace</p>
              <span className="text-[11px] font-medium text-landing-muted">Sample data</span>
            </div>
            <div className="rounded-[12px] border border-landing-border bg-landing-surface-low p-4">
              <div className="mb-3 h-3 w-24 rounded-[4px] bg-landing-border" aria-hidden="true" />
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="h-20 rounded-[8px] bg-landing-surface" aria-hidden="true" />
                <div className="h-20 rounded-[8px] bg-landing-surface" aria-hidden="true" />
                <div className="h-20 rounded-[8px] bg-landing-surface" aria-hidden="true" />
              </div>
              <div className="mt-3 h-24 rounded-[8px] bg-landing-surface" aria-hidden="true" />
            </div>
          </div>
          <div className="rounded-[12px] border border-landing-border bg-landing-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-landing-ink">Mobile workspace</p>
              <span className="text-[11px] font-medium text-landing-muted">Sample data</span>
            </div>
            <div className="mx-auto max-w-[260px] rounded-[24px] border border-landing-border bg-landing-surface-low p-3">
              <div className="rounded-[18px] bg-landing-surface p-3">
                <div className="mb-3 h-3 w-16 rounded-[4px] bg-landing-border" aria-hidden="true" />
                <div className="space-y-3">
                  <div className="h-14 rounded-[8px] bg-landing-surface-low" aria-hidden="true" />
                  <div className="h-14 rounded-[8px] bg-landing-surface-low" aria-hidden="true" />
                  <div className="h-14 rounded-[8px] bg-landing-surface-low" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
