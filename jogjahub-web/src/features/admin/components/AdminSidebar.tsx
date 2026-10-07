"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";

type IconProps = { className?: string };

function DashboardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function BadgeCheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function DisputeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  );
}

function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LogOutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: DashboardIcon },
  { href: "/admin/vendors", label: "Verifikasi Vendor", icon: BadgeCheckIcon },
  { href: "/admin/disputes", label: "Sengketa", icon: DisputeIcon },
  { href: "/admin/users", label: "Users", icon: UsersIcon, disabled: true },
];
function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        if (item.disabled) {
          return (
            <span key={item.href} className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#5A4136]/40">
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span>{item.label}</span>
              <span className="ml-auto rounded-full bg-[#F8F9FF] px-2 py-0.5 text-[10px]">Segera Hadir</span>
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] ${isActive ? "bg-[#FFF0E5] text-[#A04100]" : "text-[#121C2A] hover:bg-[#F8F9FF]"}`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  const router = useRouter();
  const { session, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <>
      {/* Mobile: top bar + hamburger (pola <details>/<summary> dari Navbar) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#E6EEFF] bg-white px-4 py-3 lg:hidden">
        <Link href="/admin" className="font-display text-lg font-bold text-[#121C2A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">
          <span className="text-[#FF6B00]">J</span>ogjaHub Admin
        </Link>
        <details className="group relative">
          <summary aria-label="Buka menu admin" className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-md border border-[#D3E2ED] text-[#121C2A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] [&::-webkit-details-marker]:hidden">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </summary>
          <div className="absolute right-0 top-14 z-50 flex w-64 flex-col gap-1 border border-[#D3E2ED] bg-white p-3 shadow-xl">
            <NavLinks />
            <div className="mt-auto border-t border-[#E6EEFF] pt-3">
              <p className="truncate px-3 text-xs text-[#5A4136]">{session?.user.name ?? "Admin"}</p>
              <button type="button" onClick={handleLogout} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#5A4136] hover:bg-[#F8F9FF]">
                <LogOutIcon className="h-[18px] w-[18px] shrink-0" /> Keluar
              </button>
            </div>
          </div>
        </details>
      </header>

      {/* Desktop: sidebar ikon tipis */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-[#E6EEFF] bg-white px-4 py-6 lg:flex">
        <Link href="/admin" className="font-display mb-8 px-2 text-lg font-bold text-[#121C2A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">
          <span className="text-[#FF6B00]">J</span>ogjaHub Admin
        </Link>
        <NavLinks />
        <div className="mt-auto border-t border-[#E6EEFF] pt-4">
          <p className="truncate px-3 text-xs text-[#5A4136]">{session?.user.name ?? "Admin"}</p>
          <button type="button" onClick={handleLogout} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#5A4136] transition hover:bg-[#F8F9FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">
            <LogOutIcon className="h-[18px] w-[18px] shrink-0" /> Keluar
          </button>
        </div>
      </aside>
    </>
  );
}