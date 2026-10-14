import { addHours, startOfHour } from "date-fns";
import { ReservationForm } from "@/components/ReservationForm";
import { toDateTimeLocal } from "@/lib/time";
import { listResources } from "@/server/services/resources";

export const dynamic = "force-dynamic";

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: Promise<{ resourceId?: string }>;
}) {
  const { resourceId } = await searchParams;
  const resources = await listResources();
  const start = addHours(startOfHour(new Date()), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New reservation</h1>
      <ReservationForm
        resources={resources.map((r) => ({ id: r.id, name: r.name, category: r.category }))}
        defaults={{
          resourceId: resourceId ?? "",
          startsAt: toDateTimeLocal(start),
          endsAt: toDateTimeLocal(addHours(start, 1)),
        }}
      />
    </div>
  );
}
