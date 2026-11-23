"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

const MeshGradient = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.MeshGradient),
  { ssr: false },
);

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function useIsMobile() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(max-width: 767px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );
}

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
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const webgl = useMemo(() => (mounted ? canUseWebGL() : false), [mounted]);
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const speed = reducedMotion || !inView ? 0 : 0.3;
  const showSecondaryLayer = !isMobile && !reducedMotion;

  return (
    <div ref={ref} aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#06120f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(47,191,159,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,124,102,0.18),transparent_40%),linear-gradient(180deg,#06120f_0%,#06120f_100%)]" />
      {webgl ? (
        <>
          <MeshGradient
            className="absolute inset-0 h-full w-full"
            colors={["#06120F", "#0E7C66", "#1F3A5F", "#2FBF9F"]}
            speed={speed}
          />
          {showSecondaryLayer ? (
            <MeshGradient
              className="absolute inset-0 h-full w-full opacity-25 mix-blend-screen"
              colors={["#06120F", "#2FBF9F", "#1F3A5F", "#0E7C66"]}
              speed={speed * 0.7}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
