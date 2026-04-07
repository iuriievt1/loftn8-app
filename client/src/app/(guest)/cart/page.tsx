"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/providers/cart";
import { api } from "@/lib/api";
import { useToast } from "@/providers/toast";
import { RequireTable } from "@/components/RequireTable";
import { useAuth } from "@/providers/auth";
import { useGuestFeed } from "@/providers/guestFeed";
import { PaymentSheet } from "@/components/PaymentSheet";

type OrderStatus = "NEW" | "ACCEPTED" | "IN_PROGRESS" | "DELIVERED" | "CANCELLED";

function stageClass(tone: "success" | "info" | "error") {
  if (tone === "success") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
  if (tone === "error") return "border-red-400/20 bg-red-500/10 text-red-200";
  return "border-white/10 bg-white/8 text-white/80";
}

function progressBarClass(tone: "success" | "info" | "error") {
  if (tone === "success") return "bg-emerald-300";
  if (tone === "error") return "bg-red-400";
  return "bg-white";
}

function openTabStage(statuses: OrderStatus[]) {
  const active = statuses.filter((status) => status !== "CANCELLED");
  const allReady = active.length > 0 && active.every((status) => status === "DELIVERED");
  const hasPreparing = active.some((status) => status === "IN_PROGRESS");

  if (!active.length) return { label: "Cancelled", tone: "error" as const, progress: 100 };
  if (allReady) return { label: "Ready", tone: "success" as const, progress: 100 };
  if (hasPreparing) return { label: "Preparing", tone: "info" as const, progress: 68 };
  return { label: "Processing", tone: "info" as const, progress: 30 };
}

function QtyInline({
  qty,
  onMinus,
  onPlus,
}: {
  qty: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex h-11 items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-2">
      <button
        className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/30 text-lg text-white"
        onClick={onMinus}
      >
        −
      </button>
      <div className="w-8 text-center text-sm font-semibold text-white">{qty}</div>
      <button
        className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/30 text-lg text-white"
        onClick={onPlus}
      >
        +
      </button>
    </div>
  );
}

function buildOpenTab(orders: NonNullable<ReturnType<typeof useGuestFeed>["feed"]>["orders"]) {
  const activeOrders = orders.filter((order) => order.status !== "CANCELLED");
  if (!activeOrders.length) return null;

  const itemMap = new Map<
    string,
    {
      key: string;
      name: string;
      qty: number;
      totalCzk: number;
      comment?: string;
    }
  >();

  for (const order of activeOrders) {
    for (const item of order.items) {
      const key = `${item.menuItem.id}:${item.comment ?? ""}`;
      const existing = itemMap.get(key);

      if (existing) {
        existing.qty += item.qty;
        existing.totalCzk += item.totalCzk;
        continue;
      }

      itemMap.set(key, {
        key,
        name: item.menuItem.name,
        qty: item.qty,
        totalCzk: item.totalCzk,
        comment: item.comment ?? undefined,
      });
    }
  }

  const firstCreatedAt = Math.min(...activeOrders.map((order) => new Date(order.createdAt).getTime()));
  const cancelledCount = orders.filter((order) => order.status === "CANCELLED").length;

  return {
    firstCreatedAt,
    stage: openTabStage(activeOrders.map((order) => order.status)),
    totalCzk: activeOrders.reduce((sum, order) => sum + order.totalCzk, 0),
    items: Array.from(itemMap.values()),
    cancelledCount,
  };
}

export default function CartPage() {
  const { me, loading } = useAuth();
  const isAuthed = !!me?.authenticated;
  const { feed, refresh } = useGuestFeed();
  const { items, dec, add, remove, setItemComment, totalCzk, clear } = useCart();
  const { push } = useToast();

  const [orderComment, setOrderComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [useLoyalty, setUseLoyalty] = useState(false);
  const submitRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthed) clear();
  }, [loading, isAuthed, clear]);

  const openTab = useMemo(() => buildOpenTab(feed?.orders ?? []), [feed]);
  const latestPendingPayment = useMemo(
    () => (feed?.payments ?? []).find((payment) => payment.status === "PENDING") ?? null,
    [feed]
  );
  const availablePointsCzk = feed?.loyalty?.availableCzk ?? 0;
  const showOpenTab = Boolean(openTab);

  useEffect(() => {
    if (!availablePointsCzk && useLoyalty) {
      setUseLoyalty(false);
    }
  }, [availablePointsCzk, useLoyalty]);

  const submit = async () => {
    if (submitRef.current) return;

    if (!isAuthed) {
      push({
        kind: "info",
        title: "Account required",
        message: "To place an order, please sign in or register.",
        action: { label: "Sign in", href: "/auth" },
      });
      return;
    }

    if (items.length === 0) return;

    submitRef.current = true;
    setSubmitting(true);

    try {
      await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          comment: orderComment || undefined,
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            qty: item.qty,
            comment: item.comment || undefined,
          })),
        }),
      });

      await refresh();
      clear();
      setOrderComment("");

      push({
        kind: "success",
        title: "Order sent",
        message: "The items were added to your open tab.",
      });
    } catch (e: any) {
      push({ kind: "error", title: "Order error", message: e?.message ?? "Failed" });
    } finally {
      submitRef.current = false;
      setSubmitting(false);
    }
  };

  const requestPayment = async (method: "CARD" | "CASH") => {
    if (latestPendingPayment) return;
    setPayOpen(false);

    try {
      await api("/payments/request", {
        method: "POST",
        body: JSON.stringify({
        method,
          useLoyalty: availablePointsCzk > 0 ? useLoyalty : false,
        }),
      });

      await refresh();

      push({
        kind: "success",
        title: "Payment requested",
        message:
          method === "CARD"
            ? "A staff member will come with the terminal."
            : "A staff member will come for cash payment.",
      });
    } catch (e: any) {
      push({ kind: "error", title: "Payment error", message: e?.message ?? "Failed" });
    }
  };

  if (!loading && !isAuthed) {
    return (
      <RequireTable>
        <main className="mx-auto max-w-md px-4 pb-28 pt-5">
          <div className="text-[11px] tracking-[0.28em] text-white/55">LOFT №8</div>
          <h1 className="mt-1 text-2xl font-bold text-white">Cart</h1>

          <div className="mt-5 rounded-[28px] border border-white/10 bg-white/6 p-5 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            <div className="text-base font-semibold text-white">Cart unavailable</div>
            <div className="mt-2 text-sm text-white/70">
              You continued without registration — only the <b>Staff</b> section is available.
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
                href="/call"
              >
                Staff
              </Link>
              <Link className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black" href="/auth">
                Sign in / Register
              </Link>
            </div>
          </div>
        </main>
      </RequireTable>
    );
  }

  return (
    <RequireTable>
      <main className="mx-auto max-w-md px-4 pb-28 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] tracking-[0.28em] text-white/55">LOFT №8</div>
            <h1 className="mt-1 text-2xl font-bold text-white">Cart</h1>
            <div className="mt-1 text-xs text-white/60">{items.length ? "Add more whenever you want" : "Empty for now"}</div>
          </div>

          <Link
            href="/menu"
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white"
          >
            Menu
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-4 rounded-[28px] border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            Your cart is empty.{" "}
            <Link className="underline text-white" href="/menu">
              Open menu
            </Link>
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.menuItemId}
              className="rounded-[28px] border border-white/10 bg-white/6 p-4 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">{item.name}</div>
                  <div className="mt-1 text-xs text-white/65">{item.priceCzk} Kč each</div>
                </div>

                <div className="w-[132px] shrink-0">
                  <QtyInline
                    qty={item.qty}
                    onMinus={() => dec(item.menuItemId)}
                    onPlus={() => add({ id: item.menuItemId, name: item.name, priceCzk: item.priceCzk } as any)}
                  />
                </div>
              </div>

              <textarea
                className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none"
                placeholder="Item comment (optional)"
                value={item.comment ?? ""}
                onChange={(e) => setItemComment(item.menuItemId, e.target.value)}
                rows={2}
              />

              <button className="mt-2 text-xs font-semibold text-white/70 underline" onClick={() => remove(item.menuItemId)}>
                Remove
              </button>
            </div>
          ))}
        </div>

        {items.length > 0 ? (
          <div className="mt-4 rounded-[28px] border border-white/10 bg-white/6 p-4 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">New items</div>
              <div className="text-lg font-bold text-white">{totalCzk} Kč</div>
            </div>

            <textarea
              className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none"
              placeholder="Comment for the whole order (optional)"
              value={orderComment}
              onChange={(e) => setOrderComment(e.target.value)}
              rows={2}
            />

            <button
              disabled={submitting}
              className="mt-3 w-full rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
              onClick={submit}
            >
              {submitting ? "Sending…" : "Place order"}
            </button>
          </div>
        ) : null}

        <div className="mt-4 rounded-[28px] border border-white/10 bg-white/6 p-4 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Open tab</div>
              <div className="mt-1 text-xs text-white/50">Order in a couple of clicks</div>
            </div>

            <button
              disabled={!showOpenTab || !!latestPendingPayment}
              className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
              onClick={() => setPayOpen(true)}
            >
              {latestPendingPayment ? "Requested" : "Pay"}
            </button>
          </div>

          {showOpenTab && openTab ? (
            <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Current order</div>
                  <div className="mt-1 text-[11px] text-white/45">
                    {new Date(openTab.firstCreatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                <div className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stageClass(openTab.stage.tone)}`}>
                  {openTab.stage.label}
                </div>
              </div>

              <div className="mt-3 overflow-hidden rounded-full bg-white/8">
                <div
                  className={["h-1.5 rounded-full transition-all", progressBarClass(openTab.stage.tone)].join(" ")}
                  style={{ width: `${openTab.stage.progress}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-white/38">
                <span>Processing</span>
                <span>Preparing</span>
                <span>Ready</span>
              </div>

              <div className="mt-3 space-y-1.5">
                {openTab.items.slice(0, 6).map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-3 text-sm text-white/78">
                    <div>
                      {item.name} × {item.qty}
                      {item.comment ? <div className="mt-0.5 text-[11px] text-white/42">{item.comment}</div> : null}
                    </div>
                    <div className="shrink-0">{item.totalCzk} Kč</div>
                  </div>
                ))}
              </div>

              {openTab.cancelledCount > 0 ? (
                <div className="mt-3 rounded-xl border border-red-400/15 bg-red-500/6 px-3 py-2 text-[11px] text-red-200/85">
                  {openTab.cancelledCount} cancelled {openTab.cancelledCount === 1 ? "group" : "groups"} not included
                </div>
              ) : null}

              <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/38">Due now</div>
                <div className="text-sm font-semibold text-white">{feed?.totals.dueCzk ?? openTab.totalCzk} Kč</div>
              </div>

              {latestPendingPayment ? (
                <div className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-500/8 px-3 py-2 text-[11px] text-emerald-100/90">
                  Payment requested: {latestPendingPayment.methodLabel}. A staff member is handling it now.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/60">
              No open bill right now. Your next confirmed order will open a new tab automatically.
            </div>
          )}
        </div>

        <PaymentSheet
          open={payOpen}
          onClose={() => setPayOpen(false)}
          onPick={requestPayment}
          availablePointsCzk={availablePointsCzk}
          useLoyalty={useLoyalty}
          onToggleLoyalty={setUseLoyalty}
        />
      </main>
    </RequireTable>
  );
}
