import { z } from "zod";

export const createResourceSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  category: z.string().trim().min(2, "Category is required").max(50),
  capacity: z.coerce.number().int().positive().max(10000).optional(),
  location: z.string().trim().max(100).optional(),
  description: z.string().trim().max(500).optional(),
});

export const createReservationSchema = z
  .object({
    resourceId: z.string().uuid("Choose a resource"),
    reservedBy: z.string().trim().min(2, "Your name is required").max(100),
    title: z.string().trim().min(2, "A title is required").max(120),
    notes: z.string().trim().max(500).optional(),
    startsAt: z.coerce.date({ message: "Start time is invalid" }),
    endsAt: z.coerce.date({ message: "End time is invalid" }),
  })
  .refine((v) => v.endsAt > v.startsAt, {
    message: "End time must be after start time",
    path: ["endsAt"],
  })
  .refine((v) => v.endsAt.getTime() - v.startsAt.getTime() <= 24 * 3600_000, {
    message: "A single reservation cannot exceed 24 hours",
    path: ["endsAt"],
  })
  .refine((v) => v.startsAt.getTime() > Date.now() - 60_000, {
    message: "Start time cannot be in the past",
    path: ["startsAt"],
  });

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
