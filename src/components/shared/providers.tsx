"use client";

import { Provider } from "react-redux";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { makeStore, type AppStore } from "@/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState<AppStore>(makeStore);
  return (
    <SessionProvider>
      <Provider store={store}>
        {children}
        <Toaster />
      </Provider>
    </SessionProvider>
  );
}
