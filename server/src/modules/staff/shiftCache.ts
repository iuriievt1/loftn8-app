import { prisma } from "../../db/prisma";
import { HttpError } from "../../utils/httpError";

const OPEN_SHIFT_CACHE_TTL_MS = 5_000;

type OpenShiftSnapshot = {
  id: string;
  venueId: number;
  status: "OPEN" | "CLOSED";
  openedAt: Date;
  closedAt: Date | null;
};

type CacheEntry = {
  expiresAt: number;
  shift: OpenShiftSnapshot | null;
};

const openShiftCache = new Map<number, CacheEntry>();

export function invalidateOpenShiftCache(venueId?: number) {
  if (typeof venueId === "number") {
    openShiftCache.delete(venueId);
    return;
  }

  openShiftCache.clear();
}

async function queryOpenShift(venueId: number) {
  const shift = await prisma.shift.findFirst({
    where: { venueId, status: "OPEN" },
    orderBy: { openedAt: "desc" },
    select: {
      id: true,
      venueId: true,
      status: true,
      openedAt: true,
      closedAt: true,
    },
  });

  return (shift ?? null) as OpenShiftSnapshot | null;
}

export async function getOpenShift(venueId: number, opts?: { fresh?: boolean }) {
  const now = Date.now();
  const cached = openShiftCache.get(venueId);

  if (!opts?.fresh && cached && cached.expiresAt > now) {
    return cached.shift;
  }

  const shift = await queryOpenShift(venueId);
  openShiftCache.set(venueId, {
    expiresAt: now + OPEN_SHIFT_CACHE_TTL_MS,
    shift,
  });

  return shift;
}

export async function getOpenShiftOrThrow(venueId: number, opts?: { fresh?: boolean }) {
  const shift = await getOpenShift(venueId, opts);
  if (!shift) {
    throw new HttpError(409, "SHIFT_NOT_OPEN", "No active shift");
  }

  return shift;
}
