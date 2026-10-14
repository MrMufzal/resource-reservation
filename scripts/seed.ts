import "dotenv/config";
import { addDays, addHours, setHours, startOfDay } from "date-fns";
import { db, pool } from "../src/db";
import { reservations, resources } from "../src/db/schema";

async function main() {
  await db.delete(reservations);
  await db.delete(resources);

  const inserted = await db
    .insert(resources)
    .values([
      { name: "Boardroom", category: "Meeting Room", capacity: 12, location: "Floor 3" },
      { name: "Huddle Room A", category: "Meeting Room", capacity: 4, location: "Floor 2" },
      { name: "Training Hall", category: "Meeting Room", capacity: 40, location: "Ground Floor" },
      { name: "Company Van", category: "Vehicle", capacity: 8, location: "Basement Parking" },
      { name: "Projector Kit", category: "Equipment", location: "IT Store" },
    ])
    .returning();

  const byName = Object.fromEntries(inserted.map((r) => [r.name, r.id]));
  const today = startOfDay(new Date());
  const at = (dayOffset: number, hour: number) =>
    setHours(addDays(today, dayOffset), hour);

  await db.insert(reservations).values([
    { resourceId: byName["Boardroom"], reservedBy: "Nimal", title: "Sprint planning", startsAt: at(1, 9), endsAt: at(1, 11) },
    { resourceId: byName["Boardroom"], reservedBy: "Kasun", title: "Client review", startsAt: at(1, 11), endsAt: at(1, 12) },
    { resourceId: byName["Boardroom"], reservedBy: "Ayesha", title: "Board meeting", startsAt: at(2, 14), endsAt: addHours(at(2, 14), 3) },
    { resourceId: byName["Huddle Room A"], reservedBy: "Dilini", title: "1:1 catch-up", startsAt: at(1, 10), endsAt: at(1, 11) },
    { resourceId: byName["Company Van"], reservedBy: "Ruwan", title: "Site visit", startsAt: at(3, 8), endsAt: at(3, 17) },
  ]);

  console.log(`Seeded ${inserted.length} resources and sample reservations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
