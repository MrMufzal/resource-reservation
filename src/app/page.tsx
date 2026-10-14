import Link from "next/link";
import { addDays } from "date-fns";
import { dayRange } from "@/lib/time";
import { fmtRange, fmtTime } from "@/lib/format";
import { listReservations } from "@/server/services/reservations";
import { listResources } from "@/server/services/resources";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const now = new Date();
  const { from, to } = dayRange(now);
  const [resources, today, week] = await Promise.all([
    listResources(),
    listReservations({ from, to }),
    listReservations({ from: now, to: addDays(now, 7) }),
  ]);

  const inUse = new Map(
    today.filter((r) => r.startsAt <= now && r.endsAt > now).map((r) => [r.resourceId, r]),
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Active resources" value={resources.length} />
        <Stat label="Reservations today" value={today.length} />
        <Stat label="Upcoming (next 7 days)" value={week.length} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Availability right now</h2>
        {resources.length === 0 ? (
          <p className="text-sm text-gray-600">
            No resources yet. <Link className="text-emerald-700 underline" href="/resources/new">Add one</Link>.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => {
              const cur = inUse.get(r.id);
              return (
                <Link key={r.id} href={`/resources/${r.id}`} className="rounded-lg border bg-white p-4 hover:border-emerald-600">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${cur ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                      {cur ? "In use" : "Available"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{r.category}{r.location ? ` · ${r.location}` : ""}</p>
                  {cur && (
                    <p className="mt-2 text-sm text-gray-700">
                      {cur.title} — {cur.reservedBy}, until {fmtTime(cur.endsAt)}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Today&apos;s schedule</h2>
        {today.length === 0 ? (
          <p className="text-sm text-gray-600">Nothing booked today.</p>
        ) : (
          <ul className="divide-y rounded-lg border bg-white">
            {today.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <span><strong>{r.resource.name}</strong> · {r.title} ({r.reservedBy})</span>
                <span className="text-gray-600">{fmtRange(r.startsAt, r.endsAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-3xl font-semibold text-emerald-700">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
