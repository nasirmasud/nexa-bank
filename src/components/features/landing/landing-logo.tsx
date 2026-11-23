import { Landmark } from "lucide-react";

export function LandingLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-landing-primary text-landing-primary-foreground shadow-sm">
        <Landmark className="size-5" aria-hidden="true" />
      </span>
      <span className="font-heading text-xl font-bold tracking-tight text-landing-ink">
        Nexa<span className="text-landing-primary">Bank</span>
      </span>
    </div>
  );
}
