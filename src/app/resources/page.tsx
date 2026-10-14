import Link from "next/link";
import { btnCls } from "@/components/ui";
import { listResources } from "@/server/services/resources";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const resources = await listResources({ includeInactive: true });
  const groups = Object.groupBy(resources, (r) => r.category);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Resources</h1>
        <Link href="/resources/new" className={btnCls}>Add resource</Link>
      </div>

      {resources.length === 0 && <p className="text-sm text-gray-600">No resources yet.</p>}

      {Object.entries(groups).map(([category, items]) => (
        <section key={category}>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500">{category}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items?.map((r) => (
              <Link key={r.id} href={`/resources/${r.id}`} className="rounded-lg border bg-white p-4 hover:border-emerald-600">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.name}</span>
                  {!r.isActive && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs">Disabled</span>}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {[r.location, r.capacity ? `Capacity ${r.capacity}` : null].filter(Boolean).join(" · ")}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
