import Link from "next/link";
import { addDays, addHours, differenceInMinutes, format, startOfDay } from "date-fns";
import { fmtRange } from "@/lib/format";
import { listReservations } from "@/server/services/reservations";
import { listResources } from "@/server/services/resources";
import { btnGhostCls } from "@/components/ui";

export const dynamic = "force-dynamic";

const HOUR_START = 7;
const HOUR_END = 21;
const TOTAL_MIN = (HOUR_END - HOUR_START) * 60;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const parsed = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : new Date();
  const day = Number.isNaN(parsed.getTime()) ? startOfDay(new Date()) : startOfDay(parsed);

  const winStart = addHours(day, HOUR_START);
  const winEnd = addHours(day, HOUR_END);
  const [resources, reservations] = await Promise.all([
    listResources(),
    listReservations({ from: winStart, to: winEnd }),
  ]);

  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  const link = (d: Date) => `/calendar?date=${format(d, "yyyy-MM-dd")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{format(day, "EEEE, d MMMM yyyy")}</h1>
        <div className="flex items-center gap-2">
          <Link href={link(addDays(day, -1))} className={btnGhostCls}>← Prev</Link>
          <Link href="/calendar" className={btnGhostCls}>Today</Link>
          <Link href={link(addDays(day, 1))} className={btnGhostCls}>Next →</Link>
          <form className="flex gap-2">
            <input type="date" name="date" defaultValue={format(day, "yyyy-MM-dd")} className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
            <button className={btnGhostCls}>Go</button>
          </form>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <div className="min-w-[900px]">
          <div className="flex border-b text-xs text-gray-500">
            <div className="w-40 shrink-0 p-2">Resource</div>
            <div className="flex flex-1">
              {hours.map((h) => (
                <div key={h} className="flex-1 border-l p-2">{String(h).padStart(2, "0")}:00</div>
              ))}
            </div>
          </div>

          {resources.length === 0 && <p className="p-4 text-sm text-gray-600">No resources yet.</p>}

          {resources.map((res) => (
            <div key={res.id} className="flex border-b last:border-b-0">
              <div className="w-40 shrink-0 p-2 text-sm">
                <Link href={`/resources/${res.id}`} className="font-medium hover:underline">{res.name}</Link>
                <div>
                  <Link href={`/reservations/new?resourceId=${res.id}`} className="text-xs text-emerald-700 hover:underline">Book</Link>
                </div>
              </div>
              <div className="relative h-16 flex-1">
                <div className="absolute inset-0 flex">
                  {hours.map((h) => <div key={h} className="flex-1 border-l border-gray-100" />)}
                </div>
                {reservations
                  .filter((r) => r.resourceId === res.id)
                  .map((r) => {
                    const s = r.startsAt < winStart ? winStart : r.startsAt;
                    const e = r.endsAt > winEnd ? winEnd : r.endsAt;
                    if (e <= s) return null;
                    return (
                      <div
                        key={r.id}
                        title={`${r.title} — ${r.reservedBy}\n${fmtRange(r.startsAt, r.endsAt)}`}
                        className="absolute top-1 bottom-1 overflow-hidden rounded bg-emerald-600 px-1.5 py-1 text-xs text-white"
                        style={{
                          left: `${(differenceInMinutes(s, winStart) / TOTAL_MIN) * 100}%`,
                          width: `${(differenceInMinutes(e, s) / TOTAL_MIN) * 100}%`,
                        }}
                      >
                        <div className="truncate font-medium">{r.title}</div>
                        <div className="truncate opacity-90">{r.reservedBy}</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500">Showing {HOUR_START}:00–{HOUR_END}:00. Hover a block for details.</p>
    </div>
  );
}
