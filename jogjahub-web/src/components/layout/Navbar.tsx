import Link from "next/link";
import { ROUTES } from "@/src/constants/routes";

const navItems = [
  { href: ROUTES.home, label: "Home" },
  { href: ROUTES.dashboard, label: "Dashboard" },
  { href: ROUTES.vendor, label: "Vendor" },
  { href: ROUTES.admin, label: "Admin" },
];

export function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href={ROUTES.home} className="text-xl font-bold tracking-tight text-slate-900">
          JogjaHub
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href={ROUTES.login} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300">
            Login
          </Link>
          <Link href={ROUTES.register} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
