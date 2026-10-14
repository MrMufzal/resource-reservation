"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import { blankToUndefined, formValues, type FormState } from "@/lib/form";
import { createResourceSchema } from "@/lib/validation";
import { createResource, setResourceActive } from "@/server/services/resources";

export async function createResourceAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData);
  const parsed = createResourceSchema.safeParse(blankToUndefined(values));
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  try {
    await createResource(parsed.data);
  } catch (e) {
    if (e instanceof AppError) return { error: e.message, values };
    console.error(e);
    return { error: "Something went wrong. Please try again.", values };
  }

  revalidatePath("/", "layout");
  redirect("/resources");
}

export async function toggleResourceAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  await setResourceActive(id.data, formData.get("active") === "true");
  revalidatePath("/", "layout");
}
