import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const reservationStatus = pgEnum("reservation_status", [
  "confirmed",
  "cancelled",
]);

export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(), // e.g. Meeting Room, Vehicle, Equipment
  capacity: integer("capacity"),
  location: text("location"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "restrict" }),
    reservedBy: text("reserved_by").notNull(),
    title: text("title").notNull(),
    notes: text("notes"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: reservationStatus("status").notNull().default("confirmed"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check("reservations_time_order", sql`${t.endsAt} > ${t.startsAt}`),
    index("reservations_resource_start_idx").on(t.resourceId, t.startsAt),
  ],
);

export const resourcesRelations = relations(resources, ({ many }) => ({
  reservations: many(reservations),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  resource: one(resources, {
    fields: [reservations.resourceId],
    references: [resources.id],
  }),
}));

export type Resource = typeof resources.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
