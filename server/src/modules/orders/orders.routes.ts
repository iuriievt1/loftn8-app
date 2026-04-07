import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate";
import { guestSessionAuth } from "../../middleware/auth/guestSession";
import { requireUser } from "../../middleware/auth/requireUser";
import { HttpError } from "../../utils/httpError";
import { notifyOrderCreated } from "../staff/push.service";

export const ordersRouter = Router();

const OPEN_ORDER_STATUSES = ["NEW", "ACCEPTED", "IN_PROGRESS"] as const;

const CreateOrderSchema = z.object({
  comment: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.number().int().positive(),
        qty: z.number().int().min(1).max(50),
        comment: z.string().max(300).optional(),
      })
    )
    .min(1),
});

async function attachSessionToActiveShiftIfNeeded(sessionId: string) {
  const session = await prisma.guestSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      shiftId: true,
      table: { select: { venueId: true } },
    },
  });

  if (!session) throw new HttpError(401, "SESSION_INVALID", "Session invalid");
  if (session.shiftId) return session;

  const activeShift = await prisma.shift.findFirst({
    where: {
      venueId: session.table.venueId,
      status: "OPEN",
    },
    orderBy: { openedAt: "desc" },
    select: { id: true },
  });

  if (!activeShift) return session;

  await prisma.guestSession.update({
    where: { id: session.id },
    data: { shiftId: activeShift.id },
  });

  return {
    ...session,
    shiftId: activeShift.id,
  };
}

function mergeOrderComment(current?: string | null, incoming?: string | null) {
  const left = String(current ?? "").trim();
  const right = String(incoming ?? "").trim();

  if (!left) return right || null;
  if (!right || left === right) return left;
  return `${left} | ${right}`;
}

ordersRouter.post(
  "/",
  guestSessionAuth,
  requireUser,
  validate(CreateOrderSchema),
  asyncHandler(async (req, res) => {
    const session = req.guestSession!;
    const user = req.user as { id: string };

    await attachSessionToActiveShiftIfNeeded(session.id);

    const body = req.body as z.infer<typeof CreateOrderSchema>;
    const menuItemIds = body.items.map((i) => i.menuItemId);

    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, isActive: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new HttpError(400, "MENU_ITEM_INVALID", "Some menu items are invalid/inactive");
    }

    const priceMap = new Map(menuItems.map((m) => [m.id, m.priceCzk]));

    const order = await prisma.$transaction(async (tx) => {
      const latestConfirmedPayment = await (tx as any).paymentRequest.findFirst({
        where: {
          sessionId: session.id,
          status: "CONFIRMED",
        },
        orderBy: { confirmedAt: "desc" },
        select: {
          confirmedAt: true,
          createdAt: true,
        },
      });

      const paidThroughAt = latestConfirmedPayment?.confirmedAt ?? latestConfirmedPayment?.createdAt ?? null;
      const existingOpenOrder = await tx.order.findFirst({
        where: {
          sessionId: session.id,
          status: { in: [...OPEN_ORDER_STATUSES] },
          ...(paidThroughAt
            ? {
                createdAt: {
                  gt: paidThroughAt,
                },
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          comment: true,
        },
      });

      const nextItems = body.items.map((it) => ({
        menuItemId: it.menuItemId,
        qty: it.qty,
        comment: it.comment,
        priceCzk: priceMap.get(it.menuItemId)!,
      }));

      if (existingOpenOrder) {
        return tx.order.update({
          where: { id: existingOpenOrder.id },
          data: {
            userId: user.id,
            comment: mergeOrderComment(existingOpenOrder.comment, body.comment),
            items: {
              create: nextItems,
            },
          },
          include: { items: true },
        });
      }

      return tx.order.create({
        data: {
          sessionId: session.id,
          tableId: session.tableId,
          userId: user.id,
          comment: body.comment,
          items: {
            create: nextItems,
          },
        },
        include: { items: true },
      });
    });

    void notifyOrderCreated(order.id).catch((e) => {
      console.warn("push notifyOrderCreated failed", e);
    });

    res.json({ ok: true, order });
  })
);

ordersRouter.get(
  "/current",
  guestSessionAuth,
  requireUser,
  asyncHandler(async (req, res) => {
    const session = req.guestSession!;
    const orders = await prisma.order.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
    res.json({ ok: true, orders });
  })
);
