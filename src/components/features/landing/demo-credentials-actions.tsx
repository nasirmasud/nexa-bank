"use client";

import { useState } from "react";
import { Copy, Eye, EyeOff } from "lucide-react";
import type { DemoCredential } from "@/lib/demo-credentials";

export function DemoCredentialActions({ demo }: { demo: DemoCredential }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      const pinPart = demo.pin ? ` / PIN ${demo.pin}` : "";
      await navigator.clipboard.writeText(`${demo.email} / ${demo.password}${pinPart}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-2 rounded-[8px] border border-landing-border bg-landing-surface-low px-3 py-2 font-mono text-sm text-landing-ink">
        <span>{visible ? demo.password : "••••••••••"}</span>
        <button
          type="button"
          aria-label={`${visible ? "Hide" : "Show"} ${demo.label} password`}
          onClick={() => setVisible((v) => !v)}
          className="text-landing-muted hover:text-landing-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary"
        >
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
      {demo.pin ? (
        <div className="inline-flex items-center rounded-[8px] border border-landing-border bg-landing-surface-low px-3 py-2 font-mono text-sm text-landing-ink">
          <span className="text-landing-muted mr-1.5">PIN</span>
          <span>{demo.pin}</span>
        </div>
      ) : null}
      <button
        type="button"
        aria-label={`Copy ${demo.label} credentials`}
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-[8px] border border-landing-border bg-landing-surface px-3 py-2 text-sm font-medium text-landing-ink hover:bg-landing-surface-mid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary"
      >
        <Copy className="size-4" aria-hidden="true" /> {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
