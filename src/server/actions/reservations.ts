"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AppError, ConflictError, NotFoundError } from "@/lib/errors";
import { blankToUndefined, formValues, type FormState } from "@/lib/form";
import { fmtRange } from "@/lib/format";
import { createReservationSchema } from "@/lib/validation";
import {
  cancelReservation,
  createReservation,
} from "@/server/services/reservations";

export async function createReservationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData);
  const parsed = createReservationSchema.safeParse(blankToUndefined(values));
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  try {
    await createReservation(parsed.data);
  } catch (e) {
    if (e instanceof ConflictError) {
      const c = e.conflictingWith;
      const detail = c
        ? ` — "${c.title}" (${c.reservedBy}), ${fmtRange(c.startsAt, c.endsAt)}`
        : "";
      return { error: `${e.message}${detail}`, values };
    }
    if (e instanceof AppError) return { error: e.message, values };
    console.error(e);
    return { error: "Something went wrong. Please try again.", values };
  }

  revalidatePath("/", "layout");
  redirect("/reservations");
}

export async function cancelReservationAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  try {
    await cancelReservation(id.data);
  } catch (e) {
    if (!(e instanceof NotFoundError)) throw e;
  }
  revalidatePath("/", "layout");
}
