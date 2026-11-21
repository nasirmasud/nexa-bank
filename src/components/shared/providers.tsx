"use client";

import { Provider } from "react-redux";
import { SessionProvider } from "next-auth/react";
import { useRef } from "react";
import { makeStore, type AppStore } from "@/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) storeRef.current = makeStore();
  return (
    <SessionProvider>
      <Provider store={storeRef.current}>{children}</Provider>
    </SessionProvider>
  );
}
