import { and, asc, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { reservations } from "@/db/schema";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  isExclusionViolation,
} from "@/lib/errors";
import type { CreateReservationInput } from "@/lib/validation";
import { getResource } from "./resources";

/**
 * Create a reservation.
 * The database exclusion constraint is the source of truth for overlaps;
 * we catch its error and turn it into a readable ConflictError.
 */
export async function createReservation(input: CreateReservationInput) {
  const resource = await getResource(input.resourceId);
  if (!resource.isActive) {
    throw new ValidationError("This resource is currently unavailable");
  }

  try {
    const [row] = await db
      .insert(reservations)
      .values({
        resourceId: input.resourceId,
        reservedBy: input.reservedBy,
        title: input.title,
        notes: input.notes,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      })
      .returning();
    return row;
  } catch (e) {
    if (isExclusionViolation(e)) {
      const clash = await findConflict(
        input.resourceId,
        input.startsAt,
        input.endsAt,
      );
      throw new ConflictError(
        "That time slot overlaps with an existing reservation",
        clash ?? undefined,
      );
    }
    throw e;
  }
}

async function findConflict(resourceId: string, start: Date, end: Date) {
  const clash = await db.query.reservations.findFirst({
    where: and(
      eq(reservations.resourceId, resourceId),
      eq(reservations.status, "confirmed"),
      lt(reservations.startsAt, end),
      gt(reservations.endsAt, start),
    ),
  });
  return clash
    ? {
        title: clash.title,
        reservedBy: clash.reservedBy,
        startsAt: clash.startsAt,
        endsAt: clash.endsAt,
      }
    : null;
}

export async function cancelReservation(id: string) {
  const [row] = await db
    .update(reservations)
    .set({ status: "cancelled" })
    .where(and(eq(reservations.id, id), eq(reservations.status, "confirmed")))
    .returning();
  if (!row) throw new NotFoundError("Active reservation not found");
  return row;
}

/** Reservations overlapping [from, to), optionally for one resource. */
export async function listReservations(opts: {
  from?: Date;
  to?: Date;
  resourceId?: string;
  includeCancelled?: boolean;
}) {
  const conditions = [
    opts.resourceId ? eq(reservations.resourceId, opts.resourceId) : undefined,
    opts.includeCancelled ? undefined : eq(reservations.status, "confirmed"),
    opts.to ? lt(reservations.startsAt, opts.to) : undefined,
    opts.from ? gt(reservations.endsAt, opts.from) : undefined,
  ];

  return db.query.reservations.findMany({
    where: and(...conditions),
    with: { resource: true },
    orderBy: [asc(reservations.startsAt)],
  });
}

/** Is the resource free for the whole of [start, end)? */
export async function isAvailable(resourceId: string, start: Date, end: Date) {
  return (await findConflict(resourceId, start, end)) === null;
}
