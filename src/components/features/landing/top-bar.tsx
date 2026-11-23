import { Info } from "lucide-react";

export function TopBar() {
  return (
    <div className="border-b border-landing-border bg-landing-surface-low text-landing-ink">
      <div className="landing-container flex min-h-10 flex-col items-start justify-center gap-2 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2 font-medium">
          <Info className="size-4 text-landing-primary" aria-hidden="true" />
          <span>Simulated banking platform. No real money involved.</span>
        </p>
        <a
          href="#demo-credentials"
          className="font-semibold text-landing-primary underline underline-offset-4 hover:text-landing-navy"
        >
          View demo credentials
        </a>
      </div>
    </div>
  );
}
