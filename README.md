# Resource Reservation Management System

A full-stack web app that lets an organization manage its shared resources (meeting rooms, vehicles, equipment) and book them without double-booking.

- **Repository:** `<https://github.com/MrMufzal/resource-reservation>`
- **Demo video:** `<https://youtu.be/wamH222JeAI>`
- **ER diagram:** `<https://github.com/MrMufzal/resource-reservation/blob/master/ER%20Diagram.drawio>`

## The problem

Reservations were handled through informal messages and manual records, causing overlapping bookings and uncertainty about availability. This app is a single source of truth: resources are catalogued, reservations are made against them, and the system refuses any booking that overlaps an existing one.

## Features

- **Dashboard:** which resources are in use right now, today's schedule, and quick counts.
- **Resources:** add resources (name, category, capacity, location, description), group by category, disable or enable them without losing history.
- **Reservations:** create a booking with a title, owner, and time range; cancel bookings; see upcoming bookings and the last 30 days.
- **Calendar:** a day view with one timeline row per resource, with day navigation.
- **Conflict handling:** a clash shows who holds the slot and when, instead of a generic error.

## Tech stack

Next.js (App Router) · TypeScript · PostgreSQL · Drizzle ORM · Zod · Tailwind CSS · Vitest · Docker Compose (local Postgres)

## Getting started

**Prerequisites:** Node.js 22+, npm, Docker (for PostgreSQL).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env          # Windows PowerShell: copy .env.example .env

# 3. Start PostgreSQL
docker compose up -d

# 4. Create tables and the no-overlap constraint
npm run db:migrate

# 5. (Optional) load sample data
npm run db:seed

# 6. Run the app
npm run dev
```

Open http://localhost:3000.

If port 5432 is already in use, change the mapping in `docker-compose.yml` (for example `5433:5432`) and update `DATABASE_URL` in `.env`.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run db:generate` | Generate a migration from schema changes |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Reset and load sample resources and reservations |
| `npm test` | Run the tests (needs the database running and migrated) |

## Key design decisions

**1. Overlaps are prevented by the database, not just application code.**
A PostgreSQL exclusion constraint (`btree_gist` + `tstzrange`) on `(resource_id, time range)` rejects any overlapping *confirmed* reservation (see `drizzle/*_no_overlap.sql`). A "check then insert" in application code has a race condition: two simultaneous requests can both pass the check. The constraint makes the guarantee hold under concurrency. The service layer catches the constraint error (`23P01`) and returns a friendly message.

**2. Half-open time ranges `[start, end)`.** A booking ending at 11:00 and another starting at 11:00 do not conflict, which matches how people actually schedule rooms.

**3. Cancellation is a status change, not a delete.** History is preserved, and cancelled bookings are excluded from the constraint so the slot frees up immediately.

**4. Resources are disabled, never deleted.** Existing reservations keep their reference, and `ON DELETE RESTRICT` stops accidental data loss.

**5. Layered structure.** Pages and components call Server Actions (validate input, shape errors for forms), which call services (business rules, DB access). Services have no UI knowledge, so they are easy to test.

**6. Validation at the boundary.** Zod validates all input: end after start, maximum 24 hours per booking, no start time in the past. The database `CHECK (ends_at > starts_at)` is a second line of defence.

## Tests

`npm test` runs integration tests against the real database. They cover partial, contained, and containing overlaps, back-to-back bookings, the same slot on different resources, rebooking after cancellation, input validation, and **8 simultaneous requests for one slot, where exactly one succeeds**. Tests create their own resources and clean up after themselves.

## Project structure

```
src/
  app/            Pages (dashboard, resources, reservations, calendar)
  components/     Forms, nav, small UI pieces
  server/
    actions/      Server Actions (form handling)
    services/     Business rules and database access
  db/             Drizzle schema and connection
  lib/            Validation, errors, time/format helpers
drizzle/          SQL migrations (including the no-overlap constraint)
scripts/seed.ts   Sample data
tests/            Vitest integration tests
```

## Known limitations and next steps

- **No authentication.** Bookings record a free-text "reserved by" name. Next step: user accounts, so people can only cancel their own bookings.
- **Time zones.** Times are interpreted in the server's time zone; fine for a single-site organization. Next step: store a time zone per organization and convert explicitly.
- **No editing of reservations** (cancel and rebook instead), no recurring bookings, no resource editing beyond enable/disable.
- **No business hours or approval rules** per resource.
