"use client";

import dynamic from "next/dynamic";
import { useMemo, useSyncExternalStore } from "react";

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

export function FooterBackground() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const webgl = useMemo(() => (mounted ? canUseWebGL() : false), [mounted]);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#06120f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(47,191,159,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,124,102,0.18),transparent_40%),linear-gradient(180deg,#06120f_0%,#06120f_100%)]" />
      {webgl ? (
        <GlassFold
          className="absolute inset-0 h-full w-full"
          color1="#0E7C66"
          color2="#06120F"
          color3="#2FBF9F"
          speed={0.4}
          scale={1}
          noise={0.08}
        />
      ) : null}
    </div>
  );
}
