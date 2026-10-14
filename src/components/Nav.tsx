import Link from "next/link";
import { btnCls } from "./ui";

const links = [
  ["/", "Dashboard"],
  ["/calendar", "Calendar"],
  ["/resources", "Resources"],
  ["/reservations", "Reservations"],
] as const;

export function Nav() {
  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <span className="font-semibold text-emerald-700">Resource Reservations</span>
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="text-sm text-gray-600 hover:text-gray-900">
            {label}
          </Link>
        ))}
        <Link href="/reservations/new" className={`${btnCls} ml-auto`}>
          New reservation
        </Link>
      </nav>
    </header>
  );
}
