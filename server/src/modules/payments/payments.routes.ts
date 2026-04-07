import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate";
import { guestSessionAuth } from "../../middleware/auth/guestSession";
import { notifyPaymentRequested } from "../staff/push.service";
import { HttpError } from "../../utils/httpError";
import { summarizeLoyalty } from "../../utils/loyalty";

export const paymentsRouter = Router();

const RequestPaymentSchema = z.object({
  method: z.enum(["CARD", "CASH"]),
  useLoyalty: z.boolean().optional(),
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

paymentsRouter.post(
  "/request",
  guestSessionAuth,
  validate(RequestPaymentSchema),
  asyncHandler(async (req, res) => {
    const session = req.guestSession!;
    await attachSessionToActiveShiftIfNeeded(session.id);

    const body = req.body as z.infer<typeof RequestPaymentSchema>;
    const sessionWithUser = await prisma.guestSession.findUnique({
      where: { id: session.id },
      select: {
        userId: true,
        user: {
          select: {
            loyaltyTransactions: {
              select: {
                cashbackCzk: true,
                redeemedAmountCzk: true,
                availableAt: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    const loyalty = summarizeLoyalty(sessionWithUser?.user?.loyaltyTransactions ?? []);
    const canUseLoyalty = Boolean(body.useLoyalty) && loyalty.availableCzk > 0;

    const existing = await prisma.paymentRequest.findFirst({
      where: {
        sessionId: session.id,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      const updatedExisting = await (prisma as any).paymentRequest.update({
        where: { id: existing.id },
        data: {
          method: body.method,
          useLoyalty: canUseLoyalty,
        },
      });

      return res.json({ ok: true, payment: updatedExisting });
    }

    const payment = await (prisma as any).paymentRequest.create({
      data: {
        sessionId: session.id,
        tableId: session.tableId,
        method: body.method,
        useLoyalty: canUseLoyalty,
      },
    });

    void notifyPaymentRequested(payment.id).catch((e) => {
      console.warn("push notifyPaymentRequested failed", e);
    });

    res.json({ ok: true, payment });
  })
); 
