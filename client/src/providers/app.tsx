"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SessionProvider } from "./session";
import { AuthProvider } from "./auth";
import { CartProvider } from "./cart";
import { ToastProvider } from "./toast";
import { GuestFeedProvider } from "./guestFeed";
import { ensureBackendWarm } from "@/lib/backendWarmup";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStaffSurface = pathname.startsWith("/staff");

  useEffect(() => {
    void ensureBackendWarm();
  }, [pathname]);

  if (isStaffSurface) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <SessionProvider>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <GuestFeedProvider>
              {children}
            </GuestFeedProvider>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
