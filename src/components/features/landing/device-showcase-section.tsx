"use client";

import { useState } from "react";
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  CreditCard,
  Home,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

type MockMode = "light" | "dark";

const desktopTransactions = [
  { id: "TXN-8842-AC", label: "Deposit", amount: "+৳52,400.00", status: "Completed" },
  { id: "TXN-8841-AD", label: "Transfer", amount: "-৳12,500.00", status: "Completed" },
  { id: "TXN-8840-AE", label: "Withdrawal", amount: "-৳8,200.00", status: "Pending" },
  { id: "TXN-8839-AF", label: "Loan Repayment", amount: "-৳18,750.00", status: "Completed" },
];

function StatusBadge({ status, mode }: { status: string; mode: MockMode }) {
  const completed =
    mode === "dark"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";
  const pending =
    mode === "dark"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/20"
      : "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <span
      className={`inline-flex rounded-[4px] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
        status === "Completed" ? completed : pending
      }`}
    >
      {status}
    </span>
  );
}

function MiniChart({ mode }: { mode: MockMode }) {
  const stroke = mode === "dark" ? "#2FBF9F" : "#0E7C66";
  const grid = mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const fill = mode === "dark" ? "rgba(47,191,159,0.18)" : "rgba(14,124,102,0.12)";
  return (
    <svg viewBox="0 0 320 96" className="h-24 w-full" aria-hidden="true">
      {[24, 48, 72].map((y) => (
        <line key={y} x1="0" y1={y} x2="320" y2={y} stroke={grid} strokeWidth="1" />
      ))}
      <path d="M0 76 L45 66 L90 70 L135 52 L180 56 L225 38 L270 42 L320 24 V96 H0 Z" fill={fill} />
      <polyline
        points="0,76 45,66 90,70 135,52 180,56 225,38 270,42 320,24"
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[0, 45, 90, 135, 180, 225, 270, 320].map((x, i) => {
        const ys = [76, 66, 70, 52, 56, 38, 42, 24];
        return <circle key={x} cx={x} cy={ys[i]} r="3.5" fill={stroke} />;
      })}
    </svg>
  );
}

function DesktopMockup({ mode }: { mode: MockMode }) {
  const shell = mode === "dark" ? "bg-[#0f1722] border-white/10" : "bg-white border-slate-200";
  const side = mode === "dark" ? "bg-[#121c28] border-white/10" : "bg-slate-50 border-slate-200";
  const card = mode === "dark" ? "bg-[#162233] border-white/10" : "bg-white border-slate-200";
  const muted = mode === "dark" ? "text-slate-400" : "text-slate-500";
  const text = mode === "dark" ? "text-slate-100" : "text-slate-900";
  const tableHead = mode === "dark" ? "text-slate-400 border-white/10" : "text-slate-500 border-slate-200";
  const row = mode === "dark" ? "border-white/8" : "border-slate-100";
  return (
    <div className={`rounded-[12px] border p-3 sm:p-4 ${shell}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-rose-400" />
        <span className="size-2.5 rounded-full bg-amber-300" />
        <span className="size-2.5 rounded-full bg-emerald-400" />
        <span className={`ml-2 font-mono text-[10px] ${muted}`}>Desktop workspace</span>
      </div>
      <div className={`overflow-hidden rounded-[10px] border ${side}`}>
        <div className="grid min-h-[320px] grid-cols-[56px_1fr] sm:grid-cols-[160px_1fr]">
          <aside className={`border-r p-3 ${side} ${muted}`}>
            <div className={`mb-5 hidden h-8 rounded-[8px] sm:block ${mode === "dark" ? "bg-white/5" : "bg-white"}`} />
            <div className="space-y-2">
              {[LayoutDashboard, Wallet, ArrowLeftRight, CreditCard, Settings].map((Icon, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-center gap-2 rounded-[8px] px-2 py-2 sm:justify-start ${
                    i === 0 ? (mode === "dark" ? "bg-emerald-500/12 text-emerald-300" : "bg-emerald-50 text-emerald-700") : ""
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="hidden text-xs font-medium sm:inline">
                    {["Dashboard", "Accounts", "Transfers", "Loans", "Settings"][i]}
                  </span>
                </div>
              ))}
            </div>
          </aside>
          <div className={`p-3 sm:p-4 ${mode === "dark" ? "bg-[#0c1620]" : "bg-slate-50/70"}`}>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Total Balance", value: "৳8,42,500.00" },
                { label: "Deposits", value: "৳1,24,000.00" },
                { label: "Withdrawals", value: "৳46,200.00" },
              ].map((kpi) => (
                <div key={kpi.label} className={`rounded-[10px] border p-3 ${card}`}>
                  <p className={`text-[11px] ${muted}`}>{kpi.label}</p>
                  <p className={`mt-1 font-heading text-sm font-semibold tabular-nums sm:text-base ${text}`}>{kpi.value}</p>
                </div>
              ))}
            </div>
            <div className={`mt-3 rounded-[10px] border p-3 ${card}`}>
              <div className="mb-2 flex items-center justify-between">
                <p className={`text-xs font-semibold ${text}`}>Cash flow</p>
                <span className={`text-[10px] ${muted}`}>7 days</span>
              </div>
              <MiniChart mode={mode} />
            </div>
            <div className={`mt-3 overflow-hidden rounded-[10px] border ${card}`}>
              <div className={`grid grid-cols-[1.2fr_0.9fr_0.9fr_0.8fr] gap-2 border-b px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] ${tableHead}`}>
                <span>Transaction</span><span>Type</span><span className="text-right">Amount</span><span className="text-right">Status</span>
              </div>
              {desktopTransactions.map((tx) => (
                <div key={tx.id} className={`grid grid-cols-[1.2fr_0.9fr_0.9fr_0.8fr] items-center gap-2 border-b px-3 py-2 text-[11px] last:border-b-0 ${row}`}>
                  <span className={`font-mono ${muted}`}>{tx.id}</span>
                  <span className={text}>{tx.label}</span>
                  <span className={`text-right font-mono tabular-nums ${text}`}>{tx.amount}</span>
                  <div className="flex justify-end"><StatusBadge status={tx.status} mode={mode} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabletMockup({ mode }: { mode: MockMode }) {
  const shell = mode === "dark" ? "bg-[#0f1722] border-white/10" : "bg-white border-slate-200";
  const card = mode === "dark" ? "bg-[#162233] border-white/10" : "bg-white border-slate-200";
  const muted = mode === "dark" ? "text-slate-400" : "text-slate-500";
  const text = mode === "dark" ? "text-slate-100" : "text-slate-900";
  const rail = mode === "dark" ? "bg-[#121c28] border-white/10" : "bg-slate-50 border-slate-200";
  return (
    <div className={`rounded-[12px] border p-3 sm:p-4 ${shell}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className={`font-mono text-[10px] ${muted}`}>Tablet workspace</span>
        <span className={`text-[10px] ${muted}`}>820 × 1180</span>
      </div>
      <div className={`overflow-hidden rounded-[10px] border ${rail}`}>
        <div className="grid min-h-[320px] grid-cols-[52px_1fr]">
          <aside className={`flex flex-col items-center gap-2 border-r p-2 ${rail}`}>
            {[LayoutDashboard, Bell, Users, Settings].map((Icon, i) => (
              <div key={i} className={`flex size-9 items-center justify-center rounded-[8px] ${i === 0 ? (mode === "dark" ? "bg-emerald-500/12 text-emerald-300" : "bg-emerald-50 text-emerald-700") : muted}`}>
                <Icon className="size-4" />
              </div>
            ))}
          </aside>
          <div className={`p-3 ${mode === "dark" ? "bg-[#0c1620]" : "bg-slate-50/70"}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Total Balance", value: "৳8,42,500.00" },
                { label: "Deposits", value: "৳1,24,000.00" },
              ].map((kpi) => (
                <div key={kpi.label} className={`rounded-[10px] border p-3 ${card}`}>
                  <p className={`text-[11px] ${muted}`}>{kpi.label}</p>
                  <p className={`mt-1 font-heading text-base font-semibold tabular-nums ${text}`}>{kpi.value}</p>
                </div>
              ))}
            </div>
            <div className={`mt-3 rounded-[10px] border p-3 ${card}`}>
              <div className="mb-2 flex items-center justify-between">
                <p className={`text-xs font-semibold ${text}`}>Weekly activity</p>
                <span className={`text-[10px] ${muted}`}>Sample data</span>
              </div>
              <MiniChart mode={mode} />
            </div>
            <div className={`mt-3 rounded-[10px] border p-3 ${card}`}>
              <p className={`text-xs font-semibold ${text}`}>Review queue</p>
              <div className="mt-3 space-y-2">
                {["Deposit request", "KYC verification"].map((item, i) => (
                  <div key={item} className={`flex items-center justify-between rounded-[8px] px-3 py-2 text-[11px] ${mode === "dark" ? "bg-white/4" : "bg-slate-50"}`}>
                    <span className={text}>{item}</span>
                    <span className={muted}>{i === 0 ? "Pending" : "In queue"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileMockup({ mode }: { mode: MockMode }) {
  const shell = mode === "dark" ? "bg-[#0f1722] border-white/10" : "bg-white border-slate-200";
  const card = mode === "dark" ? "bg-[#162233] border-white/10" : "bg-white border-slate-200";
  const muted = mode === "dark" ? "text-slate-400" : "text-slate-500";
  const text = mode === "dark" ? "text-slate-100" : "text-slate-900";
  const tabActive = mode === "dark" ? "text-emerald-300" : "text-emerald-700";
  return (
    <div className={`rounded-[12px] border p-3 sm:p-4 ${shell}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className={`font-mono text-[10px] ${muted}`}>Mobile workspace</span>
        <span className={`text-[10px] ${muted}`}>390 × 844</span>
      </div>
      <div className={`mx-auto max-w-[280px] rounded-[28px] border p-2 ${mode === "dark" ? "border-white/10 bg-[#0b1320]" : "border-slate-200 bg-slate-100"}`}>
        <div className={`overflow-hidden rounded-[22px] border ${mode === "dark" ? "border-white/10 bg-[#0c1620]" : "border-slate-200 bg-white"}`}>
          <div className="px-4 pt-4">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${text}`}>NexaBank</span>
              <span className="size-2 rounded-full bg-emerald-400" />
            </div>
            <div className={`mt-4 rounded-[14px] border p-4 ${card}`}>
              <p className={`text-[11px] ${muted}`}>Total Balance</p>
              <p className={`mt-1 font-heading text-2xl font-semibold tabular-nums ${text}`}>৳8,42,500.00</p>
              <p className={`mt-2 text-[11px] ${muted}`}>Savings •••• 4829</p>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { label: "Salary deposit", id: "TXN-8842-AC", amount: "+৳52,400.00", status: "Completed" },
                { label: "Transfer to Current", id: "TXN-8841-AD", amount: "-৳12,500.00", status: "Completed" },
              ].map((tx) => (
                <div key={tx.id} className={`rounded-[12px] border p-3 ${card}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-xs font-semibold ${text}`}>{tx.label}</p>
                      <p className={`mt-1 font-mono text-[10px] ${muted}`}>{tx.id}</p>
                    </div>
                    <p className={`font-mono text-xs font-semibold tabular-nums ${text}`}>{tx.amount}</p>
                  </div>
                  <div className="mt-2"><StatusBadge status={tx.status} mode={mode} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className={`mt-4 grid grid-cols-5 border-t px-2 py-2 text-[10px] ${mode === "dark" ? "border-white/10 bg-[#121c28] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
            {[
              { icon: Home, label: "Home", active: true },
              { icon: Wallet, label: "Accounts", active: false },
              { icon: ArrowLeftRight, label: "Transfer", active: false },
              { icon: BarChart3, label: "Transactions", active: false },
              { icon: CreditCard, label: "Loans", active: false },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <div key={tab.label} className={`flex flex-col items-center gap-1 py-1 ${tab.active ? tabActive : ""}`}>
                  <Icon className="size-4" />
                  <span>{tab.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeviceShowcaseSection() {
  const [mode, setMode] = useState<MockMode>("light");

  return (
    <section
      className="bg-landing-bg py-24 sm:py-28 lg:pt-32 lg:pb-20 scroll-mt-28"
      aria-labelledby="devices-heading"
    >
      <div className="landing-container">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-landing-primary">
              Responsive by design
            </p>
            <h2
              id="devices-heading"
              className="mt-3 font-heading text-3xl font-semibold tracking-tight text-landing-ink sm:text-4xl"
            >
              Engineered for any screen size
            </h2>
            <p className="mt-4 text-base leading-7 text-landing-muted">
              The same banking workflows stay clear and consistent across desktop, tablet, and mobile.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-landing-muted">Mockup theme</span>
            <div
              role="group"
              aria-label="Mockup theme"
              className="inline-flex rounded-[10px] border border-landing-border bg-landing-surface p-1"
            >
              {(["light", "dark"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={mode === option}
                  onClick={() => setMode(option)}
                  className={`rounded-[8px] px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary ${
                    mode === option
                      ? "bg-landing-primary text-landing-primary-foreground"
                      : "text-landing-muted hover:text-landing-ink"
                  }`}
                >
                  {option === "light" ? "Light" : "Dark"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end">
          <span className="rounded-[4px] border border-landing-border bg-landing-surface px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-landing-muted">
            Sample data
          </span>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-6">
            <DesktopMockup mode={mode} />
          </div>
          <div className="xl:col-span-3">
            <TabletMockup mode={mode} />
          </div>
          <div className="xl:col-span-3">
            <MobileMockup mode={mode} />
          </div>
        </div>
      </div>
    </section>
  );
}
