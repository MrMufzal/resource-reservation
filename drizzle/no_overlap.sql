-- Guarantees no two CONFIRMED reservations for the same resource overlap.
-- Ranges are half-open [start, end), so back-to-back bookings are allowed.
-- Enforced by PostgreSQL itself, so it holds under concurrent requests.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_no_overlap"
  EXCLUDE USING gist (
    "resource_id" WITH =,
    tstzrange("starts_at", "ends_at", '[)') WITH &&
  )
  WHERE ("status" = 'confirmed');
