"use client";

import { Provider } from "react-redux";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { makeStore, type AppStore } from "@/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState<AppStore>(makeStore);
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      scriptProps={{ suppressHydrationWarning: true }}
    >
      <SessionProvider>
        <Provider store={store}>
          {children}
          <Toaster />
        </Provider>
      </SessionProvider>
    </ThemeProvider>
  );
}
