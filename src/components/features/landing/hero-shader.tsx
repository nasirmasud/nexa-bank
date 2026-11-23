"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

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

export function HeroShader() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [webgl] = useState(canUseWebGL);
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

  const speed = reducedMotion || !inView ? 0 : 0.25;
  const showSecondaryLayer = !isMobile && !reducedMotion;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden bg-[#06120f]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(47,191,159,0.22),transparent_35%),radial-gradient(circle_at_left,rgba(31,58,95,0.3),transparent_35%),linear-gradient(180deg,#06120f_0%,#0b0f14_100%)]" />
      {webgl ? (
        <>
          <MeshGradient
            className="absolute inset-0 h-full w-full"
            colors={["#06120F", "#0E7C66", "#1F3A5F", "#0E7C66", "#2FBF9F"]}
            speed={speed}
          />
          {showSecondaryLayer ? (
            <MeshGradient
              className="absolute inset-0 h-full w-full opacity-30 mix-blend-screen"
              colors={["#06120F", "#2FBF9F", "#1F3A5F", "#0E7C66"]}
              speed={speed * 0.7}
            />
          ) : null}
        </>
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,18,15,0.88)_0%,rgba(6,18,15,0.62)_45%,rgba(6,18,15,0.78)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,18,15,0.25)_0%,rgba(6,18,15,0.15)_40%,rgba(6,18,15,0.55)_100%)]" />
    </div>
  );
}
