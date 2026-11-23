"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

const GlassFold = dynamic(
  () => import("@/components/ui/glass-fold").then((mod) => mod.GlassFold),
  { ssr: false },
);

function canUseWebGL() {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

const emptySubscribe = () => () => {};

export function HeroBackground() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const webgl = useMemo(() => (mounted ? canUseWebGL() : false), [mounted]);
  const [failed, setFailed] = useState(false);
  const handleError = useCallback(() => setFailed(true), []);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#06120f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(47,191,159,0.22),transparent_35%),radial-gradient(circle_at_left,rgba(31,58,95,0.3),transparent_35%),linear-gradient(180deg,#06120f_0%,#0b0f14_100%)]" />
      {webgl && !failed ? (
        <GlassFold
          className="absolute inset-0 h-full w-full"
          color1="#0E7C66"
          color2="#06120F"
          color3="#2FBF9F"
          speed={0.4}
          scale={1}
          noise={0.08}
          onError={handleError}
        />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,18,15,0.88)_0%,rgba(6,18,15,0.62)_45%,rgba(6,18,15,0.78)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,18,15,0.25)_0%,rgba(6,18,15,0.15)_40%,rgba(6,18,15,0.55)_100%)]" />
    </div>
  );
}
