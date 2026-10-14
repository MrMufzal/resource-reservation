import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { resources } from "@/db/schema";
import {
  ConflictError,
  NotFoundError,
  isUniqueViolation,
} from "@/lib/errors";
import type { CreateResourceInput } from "@/lib/validation";

export async function listResources(opts: { includeInactive?: boolean } = {}) {
  return db.query.resources.findMany({
    where: opts.includeInactive ? undefined : eq(resources.isActive, true),
    orderBy: [asc(resources.category), asc(resources.name)],
  });
}

export async function getResource(id: string) {
  const resource = await db.query.resources.findFirst({
    where: eq(resources.id, id),
  });
  if (!resource) throw new NotFoundError("Resource not found");
  return resource;
}

export async function createResource(input: CreateResourceInput) {
  try {
    const [row] = await db.insert(resources).values(input).returning();
    return row;
  } catch (e) {
    if (isUniqueViolation(e)) {
      throw new ConflictError(`A resource named "${input.name}" already exists`);
    }
    throw e;
  }
}

/** Soft-disable: keeps reservation history intact. */
export async function setResourceActive(id: string, isActive: boolean) {
  const [row] = await db
    .update(resources)
    .set({ isActive })
    .where(eq(resources.id, id))
    .returning();
  if (!row) throw new NotFoundError("Resource not found");
  return row;
}
