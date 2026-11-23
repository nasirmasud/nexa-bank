"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  CreditCard,
  Home,
  Landmark,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

type MockMode = "light" | "dark";

const emptySubscribe = () => () => {};

const desktopTransactions = [
  { id: "TXN-8842-AC", label: "Deposit", amount: "+৳52,400.00", status: "Completed" },
  { id: "TXN-8841-AD", label: "Transfer", amount: "-৳12,500.00", status: "Completed" },
  { id: "TXN-8840-AE", label: "Withdrawal", amount: "-৳8,200.00", status: "Pending" },
  { id: "TXN-8839-AF", label: "Loan Repayment", amount: "-৳18,750.00", status: "Completed" },
];

function useArtboardScale(artboardWidth: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const width = el.clientWidth;
      if (width > 0) setScale(Math.min(1, width / artboardWidth));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [artboardWidth]);

  return { containerRef, scale };
}

function ScaledArtboard({
  width,
  height,
  children,
  className = "",
}: {
  width: number;
  height: number;
  children: React.ReactNode;
  className?: string;
}) {
  const { containerRef, scale } = useArtboardScale(width);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden ${className}`.trim()}
      style={{ height: height * scale }}
    >
      <div
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

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
      className={`inline-flex whitespace-nowrap rounded-[4px] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
        status === "Completed" ? completed : pending
      }`}
    >
      {status}
    </span>
  );
}

function MiniChart({ mode, height = 96 }: { mode: MockMode; height?: number }) {
  const stroke = mode === "dark" ? "#2FBF9F" : "#0E7C66";
  const grid = mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const fill = mode === "dark" ? "rgba(47,191,159,0.18)" : "rgba(14,124,102,0.12)";
  return (
    <svg viewBox="0 0 320 96" className="w-full" style={{ height }} aria-hidden="true">
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

function DesktopArtboard({ mode }: { mode: MockMode }) {
  const shell = mode === "dark" ? "bg-[#0f1722] border-white/10" : "bg-white border-slate-200";
  const side = mode === "dark" ? "bg-[#121c28] border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500";
  const card = mode === "dark" ? "bg-[#162233] border-white/10" : "bg-white border-slate-200";
  const muted = mode === "dark" ? "text-slate-400" : "text-slate-500";
  const text = mode === "dark" ? "text-slate-100" : "text-slate-900";
  const tableHead = mode === "dark" ? "text-slate-400 border-white/10" : "text-slate-500 border-slate-200";
  const row = mode === "dark" ? "border-white/[0.08]" : "border-slate-100";
  const activeNav = mode === "dark" ? "bg-emerald-500/12 text-emerald-300" : "bg-emerald-50 text-emerald-700";

  return (
    <div className={`h-full rounded-[16px] border p-5 ${shell}`}>
      <div className="mb-4 flex items-center gap-2">
        <span className="size-3 rounded-full bg-rose-400" />
        <span className="size-3 rounded-full bg-amber-300" />
        <span className="size-3 rounded-full bg-emerald-400" />
        <span className={`ml-2 font-mono text-[12px] ${muted}`}>Desktop workspace</span>
      </div>
      <div className={`overflow-hidden rounded-[12px] border ${mode === "dark" ? "border-white/10" : "border-slate-200"}`}>
        <div className="grid h-[640px] grid-cols-[220px_1fr]">
          <aside className={`border-r p-4 ${side}`}>
            <div className="mb-6 flex items-center gap-3 px-2">
              <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-[#0E7C66] text-white">
                <Landmark className="size-5" aria-hidden="true" />
              </span>
              <span className={`font-heading text-lg font-bold tracking-tight ${mode === "dark" ? "text-slate-100" : "text-slate-900"}`}>
                Nexa<span className="text-[#0E7C66]">Bank</span>
              </span>
            </div>
            <div className="space-y-1">
              {[
                { icon: LayoutDashboard, label: "Dashboard", active: true },
                { icon: Wallet, label: "Accounts", active: false },
                { icon: ArrowLeftRight, label: "Transfers", active: false },
                { icon: CreditCard, label: "Loans", active: false },
                { icon: Settings, label: "Settings", active: false },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[14px] font-medium ${
                      item.active ? activeNav : ""
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </aside>

          <div className={`p-5 ${mode === "dark" ? "bg-[#0c1620]" : "bg-slate-50/70"}`}>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Balance", value: "৳8,42,500.00" },
                { label: "Deposits", value: "৳1,24,000.00" },
                { label: "Withdrawals", value: "৳46,200.00" },
              ].map((kpi) => (
                <div key={kpi.label} className={`rounded-[12px] border p-4 ${card}`}>
                  <p className={`whitespace-nowrap text-[13px] ${muted}`}>{kpi.label}</p>
                  <p className={`mt-2 whitespace-nowrap font-heading text-[28px] font-semibold tabular-nums tracking-tight ${text}`}>
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>

            <div className={`mt-4 rounded-[12px] border p-4 ${card}`}>
              <div className="mb-3 flex items-center justify-between">
                <p className={`text-[14px] font-semibold ${text}`}>Cash flow</p>
                <span className={`text-[12px] ${muted}`}>7 days</span>
              </div>
              <MiniChart mode={mode} height={110} />
            </div>

            <div className={`mt-4 overflow-hidden rounded-[12px] border ${card}`}>
              <div className={`grid grid-cols-[220px_160px_1fr_140px] items-center gap-4 border-b px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] ${tableHead}`}>
                <span>Transaction ID</span>
                <span>Type</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Status</span>
              </div>
              {desktopTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`grid grid-cols-[220px_160px_1fr_140px] items-center gap-4 border-b px-4 py-3 text-[13px] last:border-b-0 ${row}`}
                >
                  <span className={`whitespace-nowrap font-mono ${muted}`}>{tx.id}</span>
                  <span className={`whitespace-nowrap ${text}`}>{tx.label}</span>
                  <span className={`whitespace-nowrap text-right font-mono tabular-nums ${text}`}>{tx.amount}</span>
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

function TabletArtboard({ mode }: { mode: MockMode }) {
  const shell = mode === "dark" ? "bg-[#0f1722] border-white/10" : "bg-white border-slate-200";
  const card = mode === "dark" ? "bg-[#162233] border-white/10" : "bg-white border-slate-200";
  const muted = mode === "dark" ? "text-slate-400" : "text-slate-500";
  const text = mode === "dark" ? "text-slate-100" : "text-slate-900";
  const rail = mode === "dark" ? "bg-[#121c28] border-white/10" : "bg-slate-50 border-slate-200";

  return (
    <div className={`h-full rounded-[16px] border p-5 ${shell}`}>
      <div className="mb-4 flex items-center justify-between">
        <span className={`font-mono text-[12px] ${muted}`}>Tablet workspace</span>
        <span className={`font-mono text-[12px] ${muted}`}>820 × 1180</span>
      </div>
      <div className={`overflow-hidden rounded-[12px] border ${rail}`}>
        <div className="grid h-[560px] grid-cols-[72px_1fr]">
          <aside className={`flex flex-col items-center gap-3 border-r p-3 ${rail}`}>
            <div className="mb-2 inline-flex size-10 items-center justify-center rounded-[10px] bg-[#0E7C66] text-white">
              <Landmark className="size-5" aria-hidden="true" />
            </div>
            {[LayoutDashboard, Bell, Users, Settings].map((Icon, i) => (
              <div
                key={i}
                className={`flex size-11 items-center justify-center rounded-[10px] ${
                  i === 0 ? (mode === "dark" ? "bg-emerald-500/12 text-emerald-300" : "bg-emerald-50 text-emerald-700") : muted
                }`}
              >
                <Icon className="size-5" />
              </div>
            ))}
          </aside>
          <div className={`p-5 ${mode === "dark" ? "bg-[#0c1620]" : "bg-slate-50/70"}`}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Total Balance", value: "৳8,42,500.00" },
                { label: "Deposits", value: "৳1,24,000.00" },
              ].map((kpi) => (
                <div key={kpi.label} className={`rounded-[12px] border p-4 ${card}`}>
                  <p className={`whitespace-nowrap text-[13px] ${muted}`}>{kpi.label}</p>
                  <p className={`mt-2 whitespace-nowrap font-heading text-[30px] font-semibold tabular-nums tracking-tight ${text}`}>
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>
            <div className={`mt-4 rounded-[12px] border p-4 ${card}`}>
              <div className="mb-3 flex items-center justify-between">
                <p className={`text-[14px] font-semibold ${text}`}>Weekly activity</p>
                <span className={`text-[12px] ${muted}`}>Last 7 days</span>
              </div>
              <MiniChart mode={mode} height={120} />
            </div>
            <div className={`mt-4 rounded-[12px] border p-4 ${card}`}>
              <p className={`text-[14px] font-semibold ${text}`}>Review queue</p>
              <div className="mt-3 space-y-2">
                {[
                  { label: "Deposit request", status: "Pending" },
                  { label: "KYC verification", status: "In queue" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between rounded-[10px] px-4 py-3 text-[13px] ${mode === "dark" ? "bg-white/[0.04]" : "bg-slate-50"}`}
                  >
                    <span className={`whitespace-nowrap ${text}`}>{item.label}</span>
                    <span className={`whitespace-nowrap ${muted}`}>{item.status}</span>
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

function MobileArtboard({ mode }: { mode: MockMode }) {
  const shell = mode === "dark" ? "bg-[#0f1722] border-white/10" : "bg-white border-slate-200";
  const card = mode === "dark" ? "bg-[#162233] border-white/10" : "bg-white border-slate-200";
  const muted = mode === "dark" ? "text-slate-400" : "text-slate-500";
  const text = mode === "dark" ? "text-slate-100" : "text-slate-900";
  const tabActive = mode === "dark" ? "text-emerald-300" : "text-emerald-700";

  return (
    <div className={`h-full rounded-[16px] border p-5 ${shell}`}>
      <div className="mb-4 flex items-center justify-between">
        <span className={`font-mono text-[12px] ${muted}`}>Mobile workspace</span>
        <span className={`font-mono text-[12px] ${muted}`}>390 × 844</span>
      </div>
      <div className="mx-auto w-[340px] rounded-[36px] border border-slate-300/30 bg-[#0b1320] p-3 dark:border-white/10">
        <div className={`overflow-hidden rounded-[28px] border ${mode === "dark" ? "border-white/10 bg-[#0c1620]" : "border-slate-200 bg-white"}`}>
          <div className="px-5 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-7 items-center justify-center rounded-[8px] bg-[#0E7C66] text-white">
                  <Landmark className="size-4" aria-hidden="true" />
                </span>
                <span className={`text-[14px] font-semibold ${text}`}>NexaBank</span>
              </div>
              <span className="size-2.5 rounded-full bg-emerald-400" />
            </div>

            <div className={`mt-5 rounded-[16px] border p-5 ${card}`}>
              <p className={`whitespace-nowrap text-[12px] ${muted}`}>Total Balance</p>
              <p className={`mt-2 whitespace-nowrap font-heading text-[34px] font-semibold tabular-nums tracking-tight ${text}`}>
                ৳8,42,500.00
              </p>
              <p className={`mt-2 whitespace-nowrap text-[12px] ${muted}`}>Savings •••• 4829</p>
            </div>

            <div className="mt-4 space-y-3">
              {[
                { label: "Salary deposit", id: "TXN-8842-AC", amount: "+৳52,400.00", status: "Completed" },
                { label: "Transfer to Current", id: "TXN-8841-AD", amount: "-৳12,500.00", status: "Completed" },
              ].map((tx) => (
                <div key={tx.id} className={`rounded-[14px] border p-4 ${card}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`truncate whitespace-nowrap text-[14px] font-semibold ${text}`}>{tx.label}</p>
                      <p className={`mt-1 whitespace-nowrap font-mono text-[11px] ${muted}`}>{tx.id}</p>
                    </div>
                    <p className={`shrink-0 whitespace-nowrap font-mono text-[14px] font-semibold tabular-nums ${text}`}>
                      {tx.amount}
                    </p>
                  </div>
                  <div className="mt-3">
                    <StatusBadge status={tx.status} mode={mode} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`mt-5 grid grid-cols-5 border-t px-1 py-2 ${mode === "dark" ? "border-white/10 bg-[#121c28] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
            {[
              { icon: Home, label: "Home", active: true },
              { icon: Wallet, label: "Accounts", active: false },
              { icon: ArrowLeftRight, label: "Transfer", active: false },
              { icon: BarChart3, label: "Txns", active: false },
              { icon: CreditCard, label: "Loans", active: false },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <div
                  key={tab.label}
                  className={`flex min-w-0 flex-col items-center gap-1 px-1 py-1.5 ${tab.active ? tabActive : ""}`}
                >
                  <Icon className="size-[18px] shrink-0" />
                  <span className="w-full truncate text-center text-[10px] leading-none">{tab.label}</span>
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
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [userMode, setUserMode] = useState<MockMode | null>(null);
  const mode: MockMode = userMode ?? (mounted && resolvedTheme === "dark" ? "light" : "dark");

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

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-[4px] border border-landing-border bg-landing-surface px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-landing-muted">
              Sample data
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-landing-muted">
              Mockup theme
            </span>
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
                  onClick={() => setUserMode(option)}
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

        <div className="mt-8 space-y-6">
          <ScaledArtboard width={1200} height={730} className="mx-auto">
            <DesktopArtboard mode={mode} />
          </ScaledArtboard>

          <div className="grid gap-6 lg:grid-cols-2">
            <ScaledArtboard width={820} height={650} className="mx-auto">
              <TabletArtboard mode={mode} />
            </ScaledArtboard>
            <ScaledArtboard width={390} height={760} className="mx-auto">
              <MobileArtboard mode={mode} />
            </ScaledArtboard>
          </div>
        </div>
      </div>
    </section>
  );
}
