"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { ROUTES } from "@/src/constants/routes";

export function CustomerDashboardShell({ children }: { children: ReactNode }) {
  const { session, isHydrated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!isHydrated) {
    return <main className="grid min-h-dvh place-items-center bg-[#F0F4FF] text-sm font-medium text-[#263449]" role="status">Memuat sesi...</main>;
  }

  if (!session || session.user.role !== "customer") {
    return null;
  }

  const navItems = [
    { href: ROUTES.dashboard, label: "Jelajahi layanan" },
    { href: ROUTES.dashboardOrders, label: "Pesanan saya" },
  ];

  return (
    <div className="min-h-dvh bg-[#F0F4FF]">
      <header className="sticky top-0 z-40 border-b border-[#DFE6F3] bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <Link href={ROUTES.dashboard} className="font-display shrink-0 text-xl font-bold tracking-tight text-[#121C2A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A04100]">
            <span className="text-[#FF6B00]">Jogja</span>Hub
          </Link>
          <nav aria-label="Navigasi akun" className="order-3 flex w-full items-center gap-2 overflow-x-auto sm:order-none sm:w-auto">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href === ROUTES.dashboard && pathname.startsWith(`${ROUTES.dashboard}/services`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] ${
                    active ? "bg-[#0F172A] text-white" : "text-[#263449] hover:bg-[#EFF4FF]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-40 truncate text-sm font-medium text-[#263449] sm:inline">{session.user.name}</span>
            <button type="button" onClick={() => { logout(); router.replace(ROUTES.home); }} className="inline-flex min-h-10 items-center rounded-lg border border-[#B8C2D3] px-3 text-sm font-semibold text-[#263449] hover:bg-[#F8F9FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Keluar</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-0 sm:px-2 lg:px-4">{children}</main>
      <footer className="mt-12 border-t border-[#DFE6F3] bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-6 text-sm text-[#4B596B] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Link href={ROUTES.home} className="font-display font-semibold text-[#121C2A] hover:text-[#A04100]">JogjaHub</Link>
          <p>Temukan layanan lokal untuk persiapan wisudamu.</p>
        </div>
      </footer>
    </div>
  );
}
