import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import type { CallStatus, CallType, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { HttpError } from "../../utils/httpError";
import { validate } from "../../middleware/validate";
import { guestSessionAuth } from "../../middleware/auth/guestSession";
import { summarizeLoyalty } from "../../utils/loyalty";

export const guestRouter = Router();

const CreateSessionSchema = z.object({
  tableCode: z.string().min(1),
});

const CreateRatingSchema = z.object({
  food: z.number().min(1).max(5).optional(),
  drinks: z.number().min(1).max(5).optional(),
  hookah: z.number().min(1).max(5).optional(),
  comment: z.string().max(500).optional(),
});

function setCookie(res: any, name: string, value: string, maxAgeSeconds: number) {
  const isProd = env.NODE_ENV === "production";

  res.cookie(name, value, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    domain: env.COOKIE_DOMAIN || undefined,
    maxAge: maxAgeSeconds * 1000,
    path: "/",
  });
}

function normalizeTableCode(raw: string) {
  const v = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (!v) return "";
  if (/^\d+$/.test(v)) return `T${v}`;
  if (/^T\d+$/.test(v)) return v;
  if (v === "TVIP" || v === "T-VIP") return "VIP";
  return v;
}

function isKnownPilotTableCode(code: string) {
  if (code === "VIP") return true;
  if (!/^T\d+$/.test(code)) return false;
  const n = Number(code.slice(1));
  return Number.isInteger(n) && n >= 1 && n <= 17;
}

async function resolveTableByCode(rawTableCode: string) {
  const tableCode = normalizeTableCode(rawTableCode);
  if (!tableCode) return null;

  const existing = await prisma.table.findUnique({
    where: { code: tableCode },
    select: { id: true, code: true, label: true, venueId: true },
  });
  if (existing) return existing;

  if (!isKnownPilotTableCode(tableCode)) return null;

  const venue = await prisma.venue.findUnique({
    where: { slug: "pilot" },
    select: { id: true },
  });
  if (!venue) return null;

  const label = tableCode === "VIP" ? "VIP" : `Table ${Number(tableCode.slice(1))}`;

  return prisma.table.upsert({
    where: { code: tableCode },
    update: {
      venueId: venue.id,
      label,
    },
    create: {
      venueId: venue.id,
      code: tableCode,
      label,
    },
    select: { id: true, code: true, label: true, venueId: true },
  });
}

async function resolveUserFromCookie(req: any) {
  const uid = (req.cookies?.uid as string | undefined) ?? undefined;
  if (!uid) return null;

  try {
    const payload = jwt.verify(uid, env.JWT_USER_SECRET) as { userId: string };
    return prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true },
    });
  } catch {
    return null;
  }
}

async function closePreviousSessionFromCookie(req: any) {
  const gsid = (req.cookies?.gsid as string | undefined) ?? undefined;
  if (!gsid) return;

  try {
    const payload = jwt.verify(gsid, env.JWT_GUEST_SESSION_SECRET) as { sessionId: string };
    await prisma.guestSession.updateMany({
      where: {
        id: payload.sessionId,
        endedAt: null,
      },
      data: { endedAt: new Date() },
    });
  } catch {
    // ignore stale cookie
  }
}

async function resolveGuestSessionFromCookie(req: any) {
  const gsid = (req.cookies?.gsid as string | undefined) ?? undefined;
  if (!gsid) return null;

  try {
    const payload = jwt.verify(gsid, env.JWT_GUEST_SESSION_SECRET) as { sessionId: string };
    const session = await prisma.guestSession.findUnique({
      where: { id: payload.sessionId },
      include: {
        table: {
          select: { id: true, code: true, label: true, venueId: true },
        },
        shift: {
          select: { id: true, status: true, openedAt: true, closedAt: true },
        },
      },
    });

    if (!session || session.endedAt) return null;

    const user = await resolveUserFromCookie(req);
    if (user && session.userId !== user.id) {
      return prisma.guestSession.update({
        where: { id: session.id },
        data: { userId: user.id },
        include: {
          table: {
            select: { id: true, code: true, label: true, venueId: true },
          },
          shift: {
            select: { id: true, status: true, openedAt: true, closedAt: true },
          },
        },
      });
    }

    return session;
  } catch {
    return null;
  }
}

function toGuestSessionResponse(
  session: {
    id: string;
    startedAt: Date;
    table: { id: number; code: string; label: string | null };
    shift?: { id: string; openedAt: Date } | { id: string; status: string; openedAt: Date; closedAt: Date | null } | null;
  }
) {
  return {
    id: session.id,
    table: {
      id: session.table.id,
      code: session.table.code,
      label: session.table.label,
    },
    shift: session.shift
      ? {
          id: session.shift.id,
          openedAt: session.shift.openedAt,
        }
      : null,
    startedAt: session.startedAt,
  };
}

function orderStatusView(status: OrderStatus) {
  if (status === "NEW") {
    return {
      title: "Order sent",
      description: "Your order was sent to the staff team and is waiting for confirmation.",
      tone: "info" as const,
      step: 1,
    };
  }

  if (status === "ACCEPTED") {
    return {
      title: "Order accepted",
      description: "The staff has accepted your order.",
      tone: "success" as const,
      step: 2,
    };
  }

  if (status === "IN_PROGRESS") {
    return {
      title: "Preparing",
      description: "Your order is being prepared right now.",
      tone: "success" as const,
      step: 3,
    };
  }

  if (status === "DELIVERED") {
    return {
      title: "Ready",
      description: "Your order is ready or already on the table.",
      tone: "success" as const,
      step: 4,
    };
  }

  return {
    title: "Cancelled",
    description: "This order was cancelled by the staff.",
    tone: "error" as const,
    step: 0,
  };
}

function callTypeLabel(type: CallType) {
  if (type === "WAITER") return "Waiter";
  if (type === "HOOKAH") return "Hookah service";
  if (type === "BILL") return "Payment";
  return "Message";
}

function callStatusView(type: CallType, status: CallStatus, message?: string | null) {
  if (status === "NEW") {
    return {
      title: `${callTypeLabel(type)} requested`,
      description:
        type === "BILL"
          ? "Your payment request was sent to the staff."
          : "Your request was sent to the staff.",
      tone: "info" as const,
    };
  }

  if (status === "ACKED") {
    return {
      title: "On the way",
      description:
        type === "WAITER"
          ? "A waiter has seen your request and is already coming to your table."
          : type === "HOOKAH"
          ? "A hookah specialist has seen your request and is already coming to your table."
          : type === "BILL"
          ? "Your payment request was accepted and a staff member is on the way."
          : message
          ? "Your message was seen and taken into work."
          : "Your request was accepted by the staff.",
      tone: "success" as const,
    };
  }

  return {
    title: "Done",
    description:
      type === "BILL"
        ? "Your payment request was marked as completed."
        : "This request was marked as completed by the staff.",
    tone: "success" as const,
  };
}

function paymentMethodLabel(method: PaymentMethod) {
  return method === "CARD" ? "Card" : "Cash";
}

function paymentStatusView(
  method: PaymentMethod,
  status: PaymentStatus,
  amountCzk?: number | null
) {
  if (status === "PENDING") {
    return {
      title: "Payment requested",
      description: `Waiting for staff: ${paymentMethodLabel(method)}.`,
      tone: "info" as const,
    };
  }

  if (status === "CONFIRMED") {
    return {
      title: "Payment confirmed",
      description: amountCzk ? `Confirmed for ${amountCzk} Kč.` : "The payment was confirmed by the staff.",
      tone: "success" as const,
    };
  }

  return {
    title: "Payment cancelled",
    description: "This payment request was cancelled.",
    tone: "error" as const,
  };
}

guestRouter.post(
  "/session",
  validate(CreateSessionSchema),
  asyncHandler(async (req, res) => {
    const { tableCode: rawTableCode } = req.body as { tableCode: string };

    const table = await resolveTableByCode(rawTableCode);

    if (!table) {
      throw new HttpError(404, "TABLE_NOT_FOUND", "Table not found");
    }

    const user = await resolveUserFromCookie(req);
    const shift = await prisma.shift.findFirst({
      where: {
        venueId: table.venueId,
        status: "OPEN",
      },
      orderBy: { openedAt: "desc" },
      select: { id: true, openedAt: true },
    });

    const existingSession = await resolveGuestSessionFromCookie(req);
    if (existingSession && existingSession.table.id === table.id) {
      const nextUserId = user?.id ?? existingSession.userId ?? null;
      const nextShiftId = existingSession.shiftId ?? shift?.id ?? null;

      const syncedSession =
        nextUserId !== existingSession.userId || nextShiftId !== existingSession.shiftId
          ? await prisma.guestSession.update({
              where: { id: existingSession.id },
              data: {
                userId: nextUserId,
                shiftId: nextShiftId,
              },
              include: {
                table: {
                  select: { id: true, code: true, label: true },
                },
                shift: {
                  select: { id: true, openedAt: true },
                },
              },
            })
          : {
              id: existingSession.id,
              startedAt: existingSession.startedAt,
              table: {
                id: existingSession.table.id,
                code: existingSession.table.code,
                label: existingSession.table.label,
              },
              shift: existingSession.shift
                ? {
                    id: existingSession.shift.id,
                    openedAt: existingSession.shift.openedAt,
                  }
                : null,
            };

      const token = jwt.sign(
        { sessionId: existingSession.id },
        env.JWT_GUEST_SESSION_SECRET,
        { expiresIn: "24h" }
      );

      setCookie(res, "gsid", token, 60 * 60 * 24);

      return res.json({
        ok: true,
        session: toGuestSessionResponse(syncedSession),
        reused: true,
      });
    }

    await closePreviousSessionFromCookie(req);

    const session = await prisma.guestSession.create({
      data: {
        tableId: table.id,
        shiftId: shift?.id ?? null,
        userId: user?.id ?? null,
      },
    });

    const token = jwt.sign(
      { sessionId: session.id },
      env.JWT_GUEST_SESSION_SECRET,
      { expiresIn: "24h" }
    );

    setCookie(res, "gsid", token, 60 * 60 * 24);

    res.json({
      ok: true,
      session: toGuestSessionResponse({
        ...session,
        table,
        shift,
      }),
      reused: false,
    });
  })
);

guestRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const session = await resolveGuestSessionFromCookie(req);
    if (!session) {
      return res.json({ ok: false, session: null });
    }

    res.json({
      ok: true,
      session: {
        id: session.id,
        table: {
          id: session.table.id,
          code: session.table.code,
          label: session.table.label,
        },
        shift: session.shift ?? null,
        startedAt: session.startedAt,
      },
    });
  })
);

guestRouter.get(
  "/feed",
  guestSessionAuth,
  asyncHandler(async (req, res) => {
    const session = req.guestSession!;

    const [orders, calls, payments, loyaltyTransactions] = await Promise.all([
      prisma.order.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              menuItem: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      prisma.staffCall.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: "desc" },
      }),
      (prisma as any).paymentRequest.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: "desc" },
        include: {
          confirmation: {
            select: { amountCzk: true, loyaltyAppliedCzk: true, createdAt: true },
          },
        },
      }),
      session.userId
        ? (prisma as any).loyaltyTransaction.findMany({
            where: { userId: session.userId },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
    ]);

    const toFeedOrder = (order: (typeof orders)[number]) => {
      const totalCzk = order.items.reduce((sum, item) => sum + item.priceCzk * item.qty, 0);
      const view = orderStatusView(order.status);

      return {
        id: order.id,
        status: order.status,
        comment: order.comment,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        totalCzk,
        step: view.step,
        statusTitle: view.title,
        statusDescription: view.description,
        statusTone: view.tone,
        items: order.items.map((item) => ({
          id: item.id,
          qty: item.qty,
          comment: item.comment,
          priceCzk: item.priceCzk,
          totalCzk: item.priceCzk * item.qty,
          menuItem: item.menuItem,
        })),
      };
    };

    const settledOrderIds = new Set<string>();
    const history = [...(payments as any[])]
      .filter((payment: any) => payment.status === "CONFIRMED")
      .sort((a: any, b: any) => {
        const left = new Date(a.confirmedAt ?? a.createdAt).getTime();
        const right = new Date(b.confirmedAt ?? b.createdAt).getTime();
        return right - left;
      })
      .map((payment: any) => {
        const closedAt = payment.confirmedAt ?? payment.confirmation?.createdAt ?? payment.createdAt;
        const closedAtTs = new Date(closedAt).getTime();

        const scopedOrders = [...orders]
          .filter((order) => !settledOrderIds.has(order.id) && new Date(order.createdAt).getTime() < closedAtTs)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        for (const order of scopedOrders) {
          settledOrderIds.add(order.id);
        }

        const paidOrders = scopedOrders.filter((order) => order.status !== "CANCELLED");
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

        for (const order of paidOrders) {
          for (const item of order.items) {
            const key = `${item.menuItem.id}:${item.comment ?? ""}`;
            const existing = itemMap.get(key);

            if (existing) {
              existing.qty += item.qty;
              existing.totalCzk += item.priceCzk * item.qty;
              continue;
            }

            itemMap.set(key, {
              key,
              name: item.menuItem.name,
              qty: item.qty,
              totalCzk: item.priceCzk * item.qty,
              comment: item.comment ?? undefined,
            });
          }
        }

        const fallbackAmountCzk = paidOrders.reduce(
          (sum, order) => sum + order.items.reduce((inner, item) => inner + item.priceCzk * item.qty, 0),
          0
        );

        return {
          id: payment.id,
          method: payment.method,
          methodLabel: paymentMethodLabel(payment.method),
          amountCzk: payment.confirmation?.amountCzk ?? fallbackAmountCzk,
          closedAt,
          orderCount: paidOrders.length,
          itemCount: Array.from(itemMap.values()).reduce((sum, item) => sum + item.qty, 0),
          items: Array.from(itemMap.values()),
        };
      })
      .filter((entry) => entry.itemCount > 0 || entry.amountCzk > 0);

    const activeOrders = orders.filter((order) => !settledOrderIds.has(order.id));
    const feedOrders = activeOrders.map(toFeedOrder);

    const feedCalls = calls.map((call) => {
      const view = callStatusView(call.type, call.status, call.message);

      return {
        id: call.id,
        type: call.type,
        typeLabel: callTypeLabel(call.type),
        status: call.status,
        message: call.message,
        createdAt: call.createdAt,
        updatedAt: call.updatedAt,
        statusTitle: view.title,
        statusDescription: view.description,
        statusTone: view.tone,
      };
    });

    const feedPayments = (payments as any[]).map((payment: any) => {
      const amountCzk = payment.confirmation?.amountCzk ?? null;
      const view = paymentStatusView(payment.method, payment.status, amountCzk);

      return {
        id: payment.id,
        method: payment.method,
        methodLabel: paymentMethodLabel(payment.method),
        useLoyalty: Boolean((payment as any).useLoyalty),
        status: payment.status,
        createdAt: payment.createdAt,
        confirmedAt: payment.confirmedAt,
        amountCzk,
        loyaltyAppliedCzk: payment.confirmation?.loyaltyAppliedCzk ?? (payment as any).loyaltyAppliedCzk ?? 0,
        statusTitle: view.title,
        statusDescription: view.description,
        statusTone: view.tone,
      };
    });

    const orderedTotalCzk = feedOrders
      .filter((order) => order.status !== "CANCELLED")
      .reduce((sum, order) => sum + order.totalCzk, 0);

    // `history` already contains settled bills, so the current open tab should only
    // reflect the active orders left after settlement.
    const confirmedPaidCzk = 0;
    const redeemedLoyaltyCzk = 0;
    const loyalty = summarizeLoyalty(loyaltyTransactions as any[]);

    res.json({
      ok: true,
      table: {
        id: session.table.id,
        code: session.table.code,
        label: session.table.label,
      },
      totals: {
        orderedTotalCzk,
        confirmedPaidCzk,
        dueCzk: Math.max(orderedTotalCzk - confirmedPaidCzk - redeemedLoyaltyCzk, 0),
      },
      loyalty: {
        availableCzk: loyalty.availableCzk,
        pendingCzk: loyalty.pendingCzk,
        nextAvailableAt: loyalty.nextAvailableAt,
        cashbackPercent: 10,
      },
      orders: feedOrders,
      history,
      calls: feedCalls,
      payments: feedPayments,
    });
  })
);

guestRouter.post(
  "/rating",
  guestSessionAuth,
  validate(CreateRatingSchema),
  asyncHandler(async (req, res) => {
    const s = req.guestSession!;
    const { food, drinks, hookah, comment } = req.body;

    const session = await prisma.guestSession.findUnique({
      where: { id: s.id },
    });

    if (!session) {
      throw new HttpError(401, "SESSION_INVALID", "Session invalid");
    }

    if (session.endedAt) {
      throw new HttpError(401, "SESSION_ENDED", "Session ended");
    }

    const values = [food, drinks, hookah].filter((v) => typeof v === "number") as number[];

    const overall =
      values.length > 0
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : 5;

    await prisma.rating.create({
      data: {
        sessionId: session.id,
        tableId: session.tableId,
        overall,
        food,
        drinks,
        hookah,
        comment,
      },
    });

    res.json({ ok: true });
  })
);
