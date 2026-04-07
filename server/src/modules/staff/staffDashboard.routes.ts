import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { HttpError } from "../../utils/httpError";
import { validate } from "../../middleware/validate";
import { requireStaffAuth } from "./staff.middleware";
import { effectiveAvailableAt, summarizeLoyalty } from "../../utils/loyalty";
import type {
  CallType,
  CallStatus,
  OrderStatus,
  PaymentStatus,
  StaffRole,
  MenuSection,
} from "@prisma/client";

export const staffDashboardRouter = Router();
staffDashboardRouter.use(requireStaffAuth);

const IdParamSchema = z.object({
  id: z.string().min(1),
});

function callTypesForRole(role: StaffRole): CallType[] {
  if (role === "WAITER") return ["WAITER", "BILL", "HELP"];
  if (role === "HOOKAH") return ["HOOKAH", "HELP"];
  return ["WAITER", "HOOKAH", "BILL", "HELP"];
}

function orderSectionsForRole(role: StaffRole): MenuSection[] | null {
  if (role === "HOOKAH") return ["HOOKAH"];
  if (role === "WAITER") return ["DISHES", "DRINKS"];
  return null;
}

async function getActiveShiftOrThrow(venueId: number) {
  const shift = await prisma.shift.findFirst({
    where: { venueId, status: "OPEN" },
    orderBy: { openedAt: "desc" },
  });

  if (!shift) {
    throw new HttpError(409, "SHIFT_NOT_OPEN", "No active shift");
  }

  return shift;
}

// summary
staffDashboardRouter.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const venueId = req.staff!.venueId;
    const role = req.staff!.role;
    const types = callTypesForRole(role);

    const shift = await getActiveShiftOrThrow(venueId);
    const sections = orderSectionsForRole(role);

    const ordersWhere: any = {
      status: "NEW",
      session: { shiftId: shift.id },
    };

    if (sections) {
      ordersWhere.items = {
        some: {
          menuItem: { category: { section: { in: sections } } },
        },
      };
    }

    const [newOrders, newCalls, pendingPayments] = await Promise.all([
      prisma.order.count({ where: ordersWhere }),
      prisma.staffCall.count({
        where: {
          status: "NEW",
          type: { in: types },
          session: { shiftId: shift.id },
        },
      }),
      role === "HOOKAH"
        ? Promise.resolve(0)
        : prisma.paymentRequest.count({
            where: {
              status: "PENDING",
              session: { shiftId: shift.id },
            },
          }),
    ]);

    res.json({
      ok: true,
      shift: {
        id: shift.id,
        openedAt: shift.openedAt,
      },
      newOrders,
      newCalls,
      pendingPayments,
    });
  })
);

// ORDERS
staffDashboardRouter.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const venueId = req.staff!.venueId;
    const role = req.staff!.role;
    const status = (req.query.status as OrderStatus | undefined) ?? "NEW";

    const shift = await getActiveShiftOrThrow(venueId);
    const sections = orderSectionsForRole(role);

    const where: any = {
      status,
      session: { shiftId: shift.id },
    };

    if (sections) {
      where.items = {
        some: {
          menuItem: { category: { section: { in: sections } } },
        },
      };
    }

    const itemsInclude: any = sections
      ? {
          where: { menuItem: { category: { section: { in: sections } } } },
          include: { menuItem: { select: { id: true, name: true } } },
        }
      : {
          include: { menuItem: { select: { id: true, name: true } } },
        };

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        table: { select: { code: true, label: true } },
        session: { select: { id: true, user: { select: { id: true, name: true, phone: true } } } },
        items: itemsInclude,
      },
    });

    res.json({ ok: true, orders });
  })
);

const UpdateOrderStatusSchema = z.object({
  status: z.enum(["NEW", "ACCEPTED", "IN_PROGRESS", "DELIVERED", "CANCELLED"]),
});

staffDashboardRouter.patch(
  "/orders/:id/status",
  validate(UpdateOrderStatusSchema),
  asyncHandler(async (req, res) => {
    const venueId = req.staff!.venueId;
    const role = req.staff!.role;
    const shift = await getActiveShiftOrThrow(venueId);

    const { id } = IdParamSchema.parse(req.params);
    const { status } = req.body as any;

    const sections = orderSectionsForRole(role);

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        tableId: true,
        session: { select: { shiftId: true } },
        items: {
          select: {
            menuItem: { select: { category: { select: { section: true } } } },
          },
        },
      },
    });

    if (!order) throw new HttpError(404, "ORDER_NOT_FOUND", "Order not found");
    if (order.session?.shiftId !== shift.id) throw new HttpError(404, "ORDER_NOT_FOUND", "Order not found");

    if (sections) {
      const allowed = order.items.some((it) => sections.includes(it.menuItem.category.section));
      if (!allowed) throw new HttpError(404, "ORDER_NOT_FOUND", "Order not found");
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status },
    });

    res.json({ ok: true });
  })
);

// CALLS
staffDashboardRouter.get(
  "/calls",
  asyncHandler(async (req, res) => {
    const venueId = req.staff!.venueId;
    const role = req.staff!.role;
    const status = (req.query.status as CallStatus | undefined) ?? "NEW";
    const types = callTypesForRole(role);

    const shift = await getActiveShiftOrThrow(venueId);

    const calls = await prisma.staffCall.findMany({
      where: {
        status,
        type: { in: types },
        session: { shiftId: shift.id },
      },
      orderBy: { createdAt: "desc" },
      include: {
        table: { select: { code: true, label: true } },
        session: { select: { id: true, user: { select: { id: true, name: true, phone: true } } } },
      },
    });

    res.json({ ok: true, calls });
  })
);

const UpdateCallStatusSchema = z.object({
  status: z.enum(["NEW", "ACKED", "DONE"]),
});

staffDashboardRouter.patch(
  "/calls/:id/status",
  validate(UpdateCallStatusSchema),
  asyncHandler(async (req, res) => {
    const venueId = req.staff!.venueId;
    const role = req.staff!.role;
    const shift = await getActiveShiftOrThrow(venueId);

    const { id } = IdParamSchema.parse(req.params);
    const { status } = req.body as any;

    const allowedTypes = callTypesForRole(role);

    const call = await prisma.staffCall.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        session: { select: { shiftId: true } },
      },
    });

    if (!call) throw new HttpError(404, "CALL_NOT_FOUND", "Call not found");
    if (call.session?.shiftId !== shift.id) throw new HttpError(404, "CALL_NOT_FOUND", "Call not found");
    if (!allowedTypes.includes(call.type)) throw new HttpError(404, "CALL_NOT_FOUND", "Call not found");

    await prisma.staffCall.update({
      where: { id: call.id },
      data: { status },
    });

    res.json({ ok: true });
  })
);

// PAYMENTS
staffDashboardRouter.get(
  "/payments",
  asyncHandler(async (req, res) => {
    const venueId = req.staff!.venueId;
    const role = req.staff!.role;

    if (role === "HOOKAH") {
      return res.json({ ok: true, payments: [] });
    }

    const status = (req.query.status as PaymentStatus | undefined) ?? "PENDING";
    const shift = await getActiveShiftOrThrow(venueId);

    const payments = await (prisma as any).paymentRequest.findMany({
      where: {
        status,
        session: { shiftId: shift.id },
      },
      orderBy: { createdAt: "desc" },
      include: {
        table: { select: { code: true, label: true } },
        confirmation: {
          select: {
            amountCzk: true,
            loyaltyAppliedCzk: true,
          },
        },
        session: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                  loyaltyTransactions: {
                    select: {
                      createdAt: true,
                      cashbackCzk: true,
                      redeemedAmountCzk: true,
                      availableAt: true,
                  },
                },
              },
            },
            orders: {
              select: {
                createdAt: true,
                status: true,
                items: {
                  select: {
                    qty: true,
                    priceCzk: true,
                  },
                },
              },
            },
            payments: {
              where: { status: "CONFIRMED" },
              select: {
                id: true,
                confirmedAt: true,
                createdAt: true,
                confirmation: {
                  select: { amountCzk: true, createdAt: true },
                },
              },
            },
          },
        },
      },
    });

    const enrichedPayments = payments.map((payment: any) => {
      const latestConfirmedAt = payment.session.payments.reduce((latest: number, entry: any) => {
        const ts = new Date(entry.confirmedAt ?? entry.confirmation?.createdAt ?? entry.createdAt).getTime();
        return Number.isFinite(ts) && ts > latest ? ts : latest;
      }, 0);

      const currentOrders = payment.session.orders.filter((order: any) => {
        if (!latestConfirmedAt) return true;
        return new Date(order.createdAt).getTime() > latestConfirmedAt;
      });

      const orderedTotalCzk = currentOrders
        .filter((order: any) => order.status !== "CANCELLED")
        .reduce(
          (sum: number, order: any) =>
            sum + order.items.reduce((inner: number, item: any) => inner + item.qty * item.priceCzk, 0),
          0
        );

      const loyalty = summarizeLoyalty(payment.session.user?.loyaltyTransactions ?? []);
      const pendingLoyaltyAppliedCzk = payment.useLoyalty
        ? Math.min(loyalty.availableCzk, Math.max(orderedTotalCzk, 0))
        : 0;
      const pendingRequestedAmountCzk = Math.max(orderedTotalCzk - pendingLoyaltyAppliedCzk, 0);
      const confirmedLoyaltyAppliedCzk =
        payment.confirmation?.loyaltyAppliedCzk ?? payment.loyaltyAppliedCzk ?? 0;
      const paidAmountCzk = payment.confirmation?.amountCzk ?? pendingRequestedAmountCzk;
      const billTotalCzk =
        payment.status === "CONFIRMED"
          ? paidAmountCzk + confirmedLoyaltyAppliedCzk
          : orderedTotalCzk;

      return {
        ...payment,
        session: {
          id: payment.session.id,
          userId: payment.session.userId,
          user: payment.session.user,
        },
        useLoyalty: Boolean(payment.useLoyalty),
        loyaltyAppliedCzk:
          payment.status === "CONFIRMED" ? confirmedLoyaltyAppliedCzk : pendingLoyaltyAppliedCzk,
        requestedAmountCzk:
          payment.status === "CONFIRMED" ? paidAmountCzk : pendingRequestedAmountCzk,
        billTotalCzk,
        paidAmountCzk,
      };
    });

    res.json({ ok: true, payments: enrichedPayments });
  })
);

const ConfirmPaymentSchema = z.object({
  amountCzk: z.coerce.number().int().min(1).optional(),
});

staffDashboardRouter.post(
  "/payments/:id/confirm",
  validate(ConfirmPaymentSchema),
  asyncHandler(async (req, res) => {
    const venueId = req.staff!.venueId;
    const role = req.staff!.role;
    const shift = await getActiveShiftOrThrow(venueId);

    if (role === "HOOKAH") {
      throw new HttpError(403, "FORBIDDEN", "Hookah role cannot confirm payments");
    }

    const staffId = req.staff!.staffId;
    const { id } = IdParamSchema.parse(req.params);
    const CASHBACK_PERCENT = 10;

    const result = await prisma.$transaction(async (tx) => {
      const pr = await (tx as any).paymentRequest.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          sessionId: true,
          method: true,
          useLoyalty: true,
          session: {
            select: {
              shiftId: true,
              userId: true,
              user: {
                select: {
                  loyaltyTransactions: {
                    select: {
                      id: true,
                      createdAt: true,
                      cashbackCzk: true,
                      redeemedAmountCzk: true,
                      availableAt: true,
                    },
                  },
                },
              },
              orders: {
                select: {
                  createdAt: true,
                  status: true,
                  items: {
                    select: {
                      qty: true,
                      priceCzk: true,
                    },
                  },
                },
              },
              payments: {
                where: { status: "CONFIRMED" },
                select: {
                  id: true,
                  confirmedAt: true,
                  createdAt: true,
                  confirmation: {
                    select: { amountCzk: true, createdAt: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!pr) throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment request not found");
      if (pr.session?.shiftId !== shift.id) throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment request not found");

      if (pr.status !== "PENDING") {
        throw new HttpError(409, "PAYMENT_NOT_PENDING", "Payment request is not pending");
      }

      const latestConfirmedAt = pr.session.payments.reduce((latest: number, entry: any) => {
        const ts = new Date(entry.confirmedAt ?? entry.confirmation?.createdAt ?? entry.createdAt).getTime();
        return Number.isFinite(ts) && ts > latest ? ts : latest;
      }, 0);

      const currentOrders = pr.session.orders.filter((order: any) => {
        if (!latestConfirmedAt) return true;
        return new Date(order.createdAt).getTime() > latestConfirmedAt;
      });

      const orderedTotalCzk = currentOrders
        .filter((order: any) => order.status !== "CANCELLED")
        .reduce(
          (sum: number, order: any) =>
            sum + order.items.reduce((inner: number, item: any) => inner + item.qty * item.priceCzk, 0),
          0
        );

      const loyaltySummary = summarizeLoyalty(pr.session.user?.loyaltyTransactions ?? []);
      const loyaltyAppliedCzk = pr.useLoyalty
        ? Math.min(loyaltySummary.availableCzk, Math.max(orderedTotalCzk, 0))
        : 0;
      const amountCzk = Math.max(orderedTotalCzk - loyaltyAppliedCzk, 0);

      if (amountCzk < 0) {
        throw new HttpError(409, "PAYMENT_ALREADY_SETTLED", "Payment is already settled");
      }

      const updated = await (tx as any).paymentRequest.update({
        where: { id: pr.id },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
          confirmedByStaffId: staffId,
          loyaltyAppliedCzk,
        },
      });

      const confirmation = await (tx as any).paymentConfirmation.upsert({
        where: { paymentRequestId: pr.id },
        update: { amountCzk, loyaltyAppliedCzk },
        create: {
          paymentRequestId: pr.id,
          venueId,
          staffId,
          userId: pr.session?.userId ?? null,
          method: pr.method,
          amountCzk,
          loyaltyAppliedCzk,
        },
      });

      if (loyaltyAppliedCzk > 0) {
        let remainingToRedeem = loyaltyAppliedCzk;
        const availableTxns = [...(pr.session.user?.loyaltyTransactions ?? [])]
          .filter((txn: any) => effectiveAvailableAt(txn).getTime() <= Date.now())
          .map((txn: any) => ({
            ...txn,
            remaining: Math.max(txn.cashbackCzk - (txn.redeemedAmountCzk ?? 0), 0),
          }))
          .filter((txn: any) => txn.remaining > 0)
          .sort((a: any, b: any) => effectiveAvailableAt(a).getTime() - effectiveAvailableAt(b).getTime());

        for (const txn of availableTxns) {
          if (remainingToRedeem <= 0) break;
          const take = Math.min(txn.remaining, remainingToRedeem);

          await (tx as any).loyaltyTransaction.update({
            where: { id: txn.id },
            data: {
              redeemedAmountCzk: (txn.redeemedAmountCzk ?? 0) + take,
              redeemedAt: new Date(),
              redeemedInPaymentConfirmationId: confirmation.id,
            },
          });

          remainingToRedeem -= take;
        }
      }

      let loyaltyTxn = null;
      const userId = pr.session?.userId ?? null;

      if (userId && amountCzk > 0) {
        const cashbackCzk = Math.floor((amountCzk * CASHBACK_PERCENT) / 100);
        loyaltyTxn =
          cashbackCzk > 0
            ? await (tx as any).loyaltyTransaction.upsert({
                where: { paymentConfirmationId: confirmation.id },
                update: {
                  baseAmountCzk: amountCzk,
                  cashbackCzk,
                  availableAt: new Date(),
                },
                create: {
                  venueId,
                  userId,
                  staffId,
                  paymentConfirmationId: confirmation.id,
                  baseAmountCzk: amountCzk,
                  cashbackCzk,
                  availableAt: new Date(),
                },
              })
            : null;
      }

      return { updated, confirmation, loyalty: loyaltyTxn, loyaltyAppliedCzk };
    });

    res.json({ ok: true, ...result });
  })
); 
