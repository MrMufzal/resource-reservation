import { subDays } from "date-fns";
import { CancelButton } from "@/components/CancelButton";
import { fmtRange } from "@/lib/format";
import { listReservations } from "@/server/services/reservations";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  const now = new Date();
  const [upcoming, recent] = await Promise.all([
    listReservations({ from: now }),
    listReservations({ from: subDays(now, 30), to: now, includeCancelled: true }),
  ]);
  const history = recent.filter((r) => r.status === "cancelled" || r.endsAt <= now).reverse();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Reservations</h1>

      <section>
        <h2 className="mb-3 text-lg font-medium">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-600">No upcoming reservations.</p>
        ) : (
          <ul className="divide-y rounded-lg border bg-white">
            {upcoming.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                <div>
                  <div className="font-medium">{r.resource.name} · {r.title}</div>
                  <div className="text-gray-600">{r.reservedBy} · {fmtRange(r.startsAt, r.endsAt)}</div>
                </div>
                <CancelButton id={r.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Last 30 days</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-600">Nothing yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border bg-white text-sm">
            {history.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <span>{r.resource.name} · {r.title} ({r.reservedBy})</span>
                <span className="text-gray-600">
                  {fmtRange(r.startsAt, r.endsAt)}
                  {r.status === "cancelled" && <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs">Cancelled</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
