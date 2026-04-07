"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { useSession } from "@/providers/session";
import type { ToastKind } from "@/providers/toast";

type FeedTone = ToastKind;

export type GuestFeedOrder = {
  id: string;
  status: "NEW" | "ACCEPTED" | "IN_PROGRESS" | "DELIVERED" | "CANCELLED";
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  totalCzk: number;
  step: number;
  statusTitle: string;
  statusDescription: string;
  statusTone: FeedTone;
  items: Array<{
    id: string;
    qty: number;
    comment: string | null;
    priceCzk: number;
    totalCzk: number;
    menuItem: { id: number; name: string };
  }>;
};

export type GuestFeedCall = {
  id: string;
  type: "WAITER" | "HOOKAH" | "BILL" | "HELP";
  typeLabel: string;
  status: "NEW" | "ACKED" | "DONE";
  message: string | null;
  createdAt: string;
  updatedAt: string;
  statusTitle: string;
  statusDescription: string;
  statusTone: FeedTone;
};

export type GuestFeedPayment = {
  id: string;
  method: "CARD" | "CASH";
  methodLabel: string;
  useLoyalty: boolean;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  createdAt: string;
  confirmedAt: string | null;
  amountCzk: number | null;
  loyaltyAppliedCzk: number;
  statusTitle: string;
  statusDescription: string;
  statusTone: FeedTone;
};

export type GuestFeedHistory = {
  id: string;
  method: "CARD" | "CASH";
  methodLabel: string;
  amountCzk: number;
  closedAt: string;
  orderCount: number;
  itemCount: number;
  items: Array<{
    key: string;
    name: string;
    qty: number;
    totalCzk: number;
    comment?: string;
  }>;
};

export type GuestFeed = {
  table: { id: number; code: string; label: string | null };
  totals: {
    orderedTotalCzk: number;
    confirmedPaidCzk: number;
    dueCzk: number;
  };
  loyalty: {
    availableCzk: number;
    pendingCzk: number;
    nextAvailableAt: string | null;
    cashbackPercent: number;
  };
  orders: GuestFeedOrder[];
  history: GuestFeedHistory[];
  calls: GuestFeedCall[];
  payments: GuestFeedPayment[];
};

type GuestFeedState = {
  feed: GuestFeed | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<GuestFeedState | null>(null);

function isGuestSurface(pathname: string) {
  return pathname === "/cart" || pathname === "/call" || pathname === "/profile";
}

export function GuestFeedProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sessionReady } = useSession();
  const [feed, setFeed] = useState<GuestFeed | null>(null);
  const [loading, setLoading] = useState(false);

  const enabled = sessionReady && isGuestSurface(pathname);

  const refresh = async (opts?: { silent?: boolean }) => {
    if (!enabled) {
      setFeed(null);
      return;
    }

    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);

    try {
      const next = await api<{
        ok: true;
        table: GuestFeed["table"];
        totals: GuestFeed["totals"];
        loyalty: GuestFeed["loyalty"];
        orders: GuestFeed["orders"];
        history: GuestFeed["history"];
        calls: GuestFeed["calls"];
        payments: GuestFeed["payments"];
      }>("/guest/feed");

      const nextFeed: GuestFeed = {
        table: next.table,
        totals: next.totals,
        loyalty: next.loyalty,
        orders: next.orders,
        history: next.history,
        calls: next.calls,
        payments: next.payments,
      };

      setFeed(nextFeed);
    } catch {
      setFeed(null);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const { tick } = usePolling(() => refresh({ silent: true }), {
    enabled,
    activeMs: 8000,
    idleMs: 18000,
    immediate: false,
  });

  useEffect(() => {
    if (!enabled) {
      setFeed(null);
      return;
    }

    void refresh();
  }, [enabled]);

  const value = useMemo(() => ({ feed, loading, refresh }), [feed, loading]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGuestFeed() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGuestFeed must be used within GuestFeedProvider");
  return ctx;
}
