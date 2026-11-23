import { BarChart3, Bell, FileText, ShieldCheck } from "lucide-react";

const kpis = [
  { label: "Total Deposits", value: "BDT 84.2M" },
  { label: "Total Outflow", value: "BDT 41.8M" },
  { label: "Active Accounts", value: "12,840" },
  { label: "Pending Queue", value: "4" },
];

const capabilities = [
  { icon: BarChart3, title: "Analytics overview", description: "Monitor volume, account distribution, and loan activity from a centralized dashboard." },
  { icon: ShieldCheck, title: "Operational controls", description: "Review account status, requests, and role-based administrative actions." },
  { icon: FileText, title: "Audit visibility", description: "Inspect administrative activity with traceable records and review workflows." },
  { icon: Bell, title: "Alerts and queues", description: "Track pending requests and flagged items that need staff or admin attention." },
];

export function AdminPreviewSection() {
  return (
    <section className="bg-landing-surface-low py-20 scroll-mt-28" aria-labelledby="admin-preview-heading">
      <div className="landing-container grid gap-10 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-landing-primary">Executive Terminal</p>
          <h2 id="admin-preview-heading" className="mt-3 font-heading text-3xl font-semibold tracking-tight text-landing-ink sm:text-4xl">
            Admin command center preview
          </h2>
          <p className="mt-4 text-base leading-7 text-landing-muted">
            A high-level view of platform operations, approvals, and audit-ready activity. All figures shown here are illustrative sample data.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[12px] border border-landing-border bg-landing-surface p-4">
                  <Icon className="size-5 text-landing-primary" aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-semibold text-landing-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-landing-muted">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-[12px] border border-landing-border bg-landing-surface p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-landing-border pb-4">
              <div>
                <p className="font-heading text-xl font-semibold text-landing-ink">Operations Overview</p>
                <p className="text-sm text-landing-muted">Illustrative admin dashboard snapshot</p>
              </div>
              <span className="rounded-[4px] bg-landing-primary-soft px-2 py-1 text-[11px] font-semibold text-landing-primary">Sample data</span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="rounded-[12px] bg-landing-surface-low p-4">
                  <p className="text-xs text-landing-muted">{kpi.label}</p>
                  <p className="mt-2 font-heading text-xl font-semibold tabular-nums text-landing-ink">{kpi.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[12px] border border-landing-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-landing-ink">Monthly Volume</p>
                  <span className="text-[11px] text-landing-muted">Sample data</span>
                </div>
                <div className="mt-4 flex h-32 items-end gap-2">
                  {[40, 55, 70, 65, 90].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-[4px] bg-landing-primary/70" style={{ height: `${h}%` }} aria-hidden="true" />
                  ))}
                </div>
              </div>
              <div className="rounded-[12px] border border-landing-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-landing-ink">Request Queue</p>
                  <span className="text-[11px] text-landing-muted">Sample data</span>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  {[
                    ["Deposit request", "Pending review"],
                    ["KYC verification", "In queue"],
                    ["Loan application", "Awaiting decision"],
                  ].map(([item, status]) => (
                    <div key={item} className="flex items-center justify-between rounded-[8px] bg-landing-surface-low px-3 py-2">
                      <span className="text-landing-ink">{item}</span>
                      <span className="text-xs font-medium text-landing-muted">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
