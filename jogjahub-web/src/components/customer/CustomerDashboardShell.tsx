"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { ROUTES } from "@/src/constants/routes";
import { CustomerThemeProvider } from "@/src/components/customer/CustomerThemeProvider";

const navItems = [
  { href: ROUTES.dashboard, label: "Home", icon: "home" },
  { href: ROUTES.dashboardOrders, label: "Pesanan Saya", icon: "orders" },
  { href: ROUTES.dashboardHistory, label: "Riwayat", icon: "history" },
  { href: ROUTES.dashboardProfile, label: "Profil", icon: "profile" },
] as const;

function NavigationIcon({ icon }: { icon: (typeof navItems)[number]["icon"] }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
    orders: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
    history: <><path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[icon]}
    </svg>
  );
}

export function CustomerDashboardShell({ children }: { children: ReactNode }) {
  const { session, isHydrated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;

    drawerRef.current?.querySelector<HTMLElement>("nav a[href]")?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        menuButtonRef.current?.focus();
      } else if (event.key === "Tab") {
        const focusableElements = drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        );
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  if (!isHydrated) {
    return <main className="grid min-h-dvh place-items-center bg-[#F0F4FF] text-sm font-medium text-[#263449]" role="status">Memuat sesi...</main>;
  }

  if (!session || session.user.role !== "customer") {
    return null;
  }

  const closeDrawer = () => setDrawerOpen(false);
  const handleLogout = () => {
    logout();
    router.replace(ROUTES.home);
  };
  const compact = isCollapsed && !drawerOpen;

  const sidebar = (
    <>
      <div className={`flex min-h-16 items-center border-b border-[var(--customer-border)] ${
        compact ? "justify-center px-1" : "justify-between px-4 lg:px-6"
      }`}>
        <Link
          href={ROUTES.dashboard}
          onClick={closeDrawer}
          aria-label="JogjaHub - Dashboard customer"
          title={compact ? "JogjaHub" : undefined}
          className={`font-display flex items-center gap-2 text-xl font-bold tracking-tight text-[var(--customer-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--customer-primary)] ${compact ? "hidden md:flex" : ""}`}
        >
          <span className="text-[var(--customer-primary)]">{compact ? "J" : "Jogja"}</span>
          {!compact ? <span>Hub</span> : null}
        </Link>
        <button
          type="button"
          aria-label={isCollapsed ? "Buka sidebar" : "Tutup sidebar"}
          aria-expanded={!isCollapsed}
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          className="hidden h-10 w-10 items-center justify-center rounded-lg text-[var(--customer-muted)] hover:bg-[#F4F6FA] hover:text-[var(--customer-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--customer-primary)] md:inline-flex"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isCollapsed
              ? <path d="m13 5 7 7-7 7M5 5l7 7-7 7" />
              : <path d="m11 5-7 7 7 7m2-14 7 7-7 7" />}
          </svg>
        </button>
        <button
          type="button"
          aria-label="Tutup navigasi customer"
          onClick={() => { setDrawerOpen(false); menuButtonRef.current?.focus(); }}
          className={`${drawerOpen ? "inline-flex" : "hidden"} h-11 w-11 items-center justify-center rounded-lg text-[var(--customer-text)] hover:bg-[#F4F6FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--customer-primary)] md:hidden`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <nav aria-label="Navigasi customer" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = item.href === ROUTES.dashboard
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeDrawer}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--customer-primary)] ${
                compact ? "justify-center px-0" : "justify-start"
              } ${
                active
                  ? "bg-[var(--customer-primary-soft)] text-[var(--customer-primary)]"
                  : "text-[var(--customer-muted)] hover:bg-[#F4F6FA] hover:text-[var(--customer-text)]"
              }`}
            >
              <NavigationIcon icon={item.icon} />
              {!compact ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-[var(--customer-border)] p-3 lg:p-4">
        {!compact ? <p className="truncate px-2 pb-3 text-sm font-semibold text-[var(--customer-text)]">{session.user.name}</p> : null}
        <button
          type="button"
          onClick={handleLogout}
          aria-label={compact ? `Keluar dari akun ${session.user.name}` : "Keluar"}
          title={compact ? "Keluar" : undefined}
          className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[var(--customer-muted)] hover:bg-[#F4F6FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--customer-primary)] ${
            compact ? "justify-center px-0" : "justify-start"
          }`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
          </svg>
          {!compact ? <span>Keluar</span> : null}
        </button>
      </div>
    </>
  );

  return (
    <CustomerThemeProvider>
      <div className="flex min-h-dvh bg-[var(--customer-background)]">
      <aside className={`sticky top-0 z-30 hidden h-dvh shrink-0 flex-col overflow-hidden border-r border-[var(--customer-border)] bg-[var(--customer-surface)] transition-[width] duration-300 motion-reduce:transition-none md:flex ${
        isCollapsed ? "md:w-20" : "md:w-64"
      }`}>
        {sidebar}
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex min-h-16 items-center justify-between border-b border-[var(--customer-border)] bg-[var(--customer-surface)] px-4 md:hidden">
          <Link href={ROUTES.dashboard} className="font-display text-xl font-bold tracking-tight text-[var(--customer-text)]">
            <span className="text-[var(--customer-primary)]">Jogja</span>Hub
          </Link>
          <span className="max-w-40 truncate text-sm font-medium text-[var(--customer-text)]">{session.user.name}</span>
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Buka navigasi customer"
            aria-controls="customer-mobile-navigation"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--customer-text)] hover:bg-[#F4F6FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--customer-primary)]"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {drawerOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button type="button" aria-label="Tutup navigasi" onClick={() => { setDrawerOpen(false); menuButtonRef.current?.focus(); }} className="absolute inset-0 bg-[#121C2A]/45" />
            <aside ref={drawerRef} id="customer-mobile-navigation" role="dialog" aria-modal="true" aria-label="Navigasi customer" className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-[var(--customer-surface)] shadow-xl">
              {sidebar}
            </aside>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-[1440px] px-0 sm:px-2 lg:px-4">{children}</main>
        <footer className="mt-12 border-t border-[var(--customer-border)] bg-[var(--customer-surface)]">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-6 text-sm text-[var(--customer-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <Link href={ROUTES.dashboard} className="font-display font-semibold text-[var(--customer-text)] hover:text-[var(--customer-primary)]">JogjaHub</Link>
            <p>Temukan layanan lokal untuk persiapan wisudamu.</p>
          </div>
        </footer>
      </div>
      </div>
    </CustomerThemeProvider>
  );
}
