export class AppError extends Error {}

export class ValidationError extends AppError {}
export class NotFoundError extends AppError {}

export class ConflictError extends AppError {
  constructor(
    message: string,
    public readonly conflictingWith?: {
      title: string;
      reservedBy: string;
      startsAt: Date;
      endsAt: Date;
    },
  ) {
    super(message);
  }
}

/** PostgreSQL exclusion_violation (our no-overlap constraint). */
export function isExclusionViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23P01" || e?.cause?.code === "23P01";
}

/** PostgreSQL unique_violation. */
export function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}
