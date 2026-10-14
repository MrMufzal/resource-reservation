import "dotenv/config";
import { addDays, addHours, startOfDay } from "date-fns";
import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, pool } from "@/db";
import { reservations, resources } from "@/db/schema";
import { ConflictError } from "@/lib/errors";
import { createReservationSchema } from "@/lib/validation";
import {
  cancelReservation,
  createReservation,
} from "@/server/services/reservations";
import { createResource } from "@/server/services/resources";

const base = addDays(startOfDay(new Date()), 5); // a day safely in the future
const at = (h: number) => addHours(base, h);

let roomA: string;
let roomB: string;

const book = (resourceId: string, from: number, to: number, who = "Tester") =>
  createReservation({
    resourceId,
    reservedBy: who,
    title: "Test booking",
    startsAt: at(from),
    endsAt: at(to),
  });

beforeAll(async () => {
  const tag = Date.now();
  roomA = (await createResource({ name: `Test Room A ${tag}`, category: "Test" })).id;
  roomB = (await createResource({ name: `Test Room B ${tag}`, category: "Test" })).id;
});

afterAll(async () => {
  const ids = [roomA, roomB];
  await db.delete(reservations).where(inArray(reservations.resourceId, ids));
  await db.delete(resources).where(inArray(resources.id, ids));
  await pool.end();
});

describe("overlap prevention", () => {
  it("accepts a valid reservation", async () => {
    const r = await book(roomA, 9, 11);
    expect(r.status).toBe("confirmed");
  });

  it("rejects a partial overlap", async () => {
    await expect(book(roomA, 10, 12)).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects a booking fully inside an existing one", async () => {
    await expect(book(roomA, 9.5, 10)).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects a booking that fully contains an existing one", async () => {
    await expect(book(roomA, 8, 12)).rejects.toBeInstanceOf(ConflictError);
  });

  it("reports who holds the slot", async () => {
    const err = await book(roomA, 10, 12).catch((e) => e);
    expect(err.conflictingWith?.title).toBe("Test booking");
  });

  it("allows back-to-back bookings", async () => {
    await expect(book(roomA, 11, 12)).resolves.toBeDefined();
    await expect(book(roomA, 8, 9)).resolves.toBeDefined();
  });

  it("allows the same time on a different resource", async () => {
    await expect(book(roomB, 9, 11)).resolves.toBeDefined();
  });

  it("frees the slot when a reservation is cancelled", async () => {
    const r = await book(roomA, 14, 15);
    await cancelReservation(r.id);
    await expect(book(roomA, 14, 15)).resolves.toBeDefined();
  });

  it("lets exactly one of many simultaneous requests win", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, (_, i) => book(roomA, 16, 17, `User ${i}`)),
    );
    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(7);
    for (const f of failed) {
      expect((f as PromiseRejectedResult).reason).toBeInstanceOf(ConflictError);
    }
  });
});

describe("validation", () => {
  const valid = {
    resourceId: "11111111-1111-4111-8111-111111111111",
    reservedBy: "Tester",
    title: "Meeting",
    startsAt: at(9).toISOString(),
    endsAt: at(10).toISOString(),
  };

  it("accepts valid input", () => {
    expect(createReservationSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects end before start", () => {
    const r = createReservationSchema.safeParse({ ...valid, endsAt: at(8).toISOString() });
    expect(r.success).toBe(false);
  });

  it("rejects bookings longer than 24 hours", () => {
    const r = createReservationSchema.safeParse({ ...valid, endsAt: at(40).toISOString() });
    expect(r.success).toBe(false);
  });

  it("rejects a start time in the past", () => {
    const past = addDays(new Date(), -1);
    const r = createReservationSchema.safeParse({
      ...valid,
      startsAt: past.toISOString(),
      endsAt: addHours(past, 1).toISOString(),
    });
    expect(r.success).toBe(false);
  });
});
