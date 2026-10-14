import Link from "next/link";
import { notFound } from "next/navigation";
import { addDays } from "date-fns";
import { z } from "zod";
import { btnCls, btnGhostCls } from "@/components/ui";
import { fmtRange } from "@/lib/format";
import { NotFoundError } from "@/lib/errors";
import { toggleResourceAction } from "@/server/actions/resources";
import { listReservations } from "@/server/services/reservations";
import { getResource } from "@/server/services/resources";

export const dynamic = "force-dynamic";

export default async function ResourceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  let resource;
  try {
    resource = await getResource(id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  const now = new Date();
  const upcoming = await listReservations({ resourceId: id, from: now, to: addDays(now, 30) });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{resource.name}</h1>
          <p className="text-sm text-gray-600">
            {[resource.category, resource.location, resource.capacity ? `Capacity ${resource.capacity}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {resource.description && <p className="mt-2 text-sm">{resource.description}</p>}
        </div>
        <div className="flex gap-2">
          {resource.isActive && (
            <Link href={`/reservations/new?resourceId=${resource.id}`} className={btnCls}>Reserve</Link>
          )}
          <form action={toggleResourceAction}>
            <input type="hidden" name="id" value={resource.id} />
            <input type="hidden" name="active" value={String(!resource.isActive)} />
            <button className={btnGhostCls}>{resource.isActive ? "Disable" : "Enable"}</button>
          </form>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Booked in the next 30 days</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-600">Fully available.</p>
        ) : (
          <ul className="divide-y rounded-lg border bg-white">
            {upcoming.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 p-3 text-sm">
                <span>{r.title} ({r.reservedBy})</span>
                <span className="text-gray-600">{fmtRange(r.startsAt, r.endsAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
