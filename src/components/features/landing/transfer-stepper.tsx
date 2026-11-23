"use client";

import { useState } from "react";

const steps = [
  {
    title: "Initiate",
    description: "Choose a recipient, account, and amount. Required fields are validated before submission.",
    meta: "Sample data: BDT 12,500.00",
  },
  {
    title: "Verify",
    description: "Server-side checks confirm permissions, account status, and available balance.",
    meta: "Authorization and balance checks",
  },
  {
    title: "Authorize",
    description: "Sensitive actions require appropriate authentication and role permissions.",
    meta: "Role-aware controls",
  },
  {
    title: "Settle",
    description: "The transaction is recorded as a complete outcome, avoiding partial balance updates.",
    meta: "Atomic ledger write",
  },
];

export function TransferStepper() {
  const [active, setActive] = useState(0);
  const current = steps[active];

  return (
    <div className="mt-12 rounded-[12px] border border-landing-border bg-landing-surface p-5 sm:p-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Transfer steps">
        {steps.map((step, index) => {
          const selected = index === active;
          return (
            <button
              key={step.title}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-current={selected ? "step" : undefined}
              onClick={() => setActive(index)}
              className={`rounded-[8px] px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary ${
                selected
                  ? "bg-landing-primary text-landing-primary-foreground"
                  : "bg-landing-surface-low text-landing-ink hover:bg-landing-surface-mid"
              }`}
            >
              {index + 1}. {step.title}
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-[12px] bg-landing-surface-low p-5" role="tabpanel">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-landing-primary">
          Step {active + 1} of {steps.length}
        </p>
        <h3 className="mt-2 font-heading text-2xl font-semibold text-landing-ink">{current.title}</h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-landing-muted">{current.description}</p>
        <p className="mt-4 inline-flex rounded-[8px] bg-landing-surface px-3 py-2 font-mono text-xs text-landing-muted">
          {current.meta}
        </p>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => setActive((v) => Math.max(0, v - 1))}
          disabled={active === 0}
          className="rounded-[8px] border border-landing-border px-4 py-2 text-sm font-medium text-landing-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setActive((v) => Math.min(steps.length - 1, v + 1))}
          disabled={active === steps.length - 1}
          className="rounded-[8px] bg-landing-primary px-4 py-2 text-sm font-medium text-landing-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
