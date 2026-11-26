"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ROUTES } from "@/src/constants/routes";
import { useAuth } from "@/src/hooks/useAuth";
import { useApiQuery } from "@/src/hooks/useApiRequest";
import type { Resource } from "@/src/lib/api";
import { ActionButton, focusClass, linkClass, LoadingData, PageHeading, panelClass, RequestError } from "@/src/components/shared/OperationsUi";
import { approvalLabel, PortalProfileContext, type PortalProfile } from "@/src/features/vendor/portalProfile";

const links = [
  [ROUTES.vendor, "Dashboard"],
  [ROUTES.vendorServices, "Layanan"],
  [ROUTES.vendorCalendar, "Kalender"],
  [ROUTES.vendorOrders, "Pesanan"],
  [ROUTES.vendorEarnings, "Pendapatan"],
  [ROUTES.vendorProfile, "Manajemen Akun"],
] as const;

export default function VendorLayout({ children }: { children: ReactNode }) {
  const { session, isHydrated } = useAuth();
  const router = useRouter();
  const role = session?.user.role;

  useEffect(() => {
    if (!isHydrated || role === "tenant") return;
    router.replace(role === "customer" ? ROUTES.dashboard : role === "admin" ? ROUTES.admin : `${ROUTES.login}?role=tenant`);
  }, [isHydrated, role, router]);

  if (!isHydrated || role !== "tenant") return <p className="p-6" role="status">Memeriksa sesi...</p>;
  return <Portal key={session?.token} account={session?.user.name ?? "Tenant"}>{children}</Portal>;
}

function Portal({ children, account }: { children: ReactNode; account: string }) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const query = useApiQuery<Resource<PortalProfile>>("/tenant/profile");
  const [saved, setSaved] = useState<PortalProfile>();
  const profile = saved ?? query.data?.data;
  const isAccount = pathname === ROUTES.vendorProfile;

  const navigation = (
    <nav aria-label="Navigasi tenant" className="grid gap-1">
      {links.map(([href, label]) => {
        const active = pathname === href || (href !== ROUTES.vendor && pathname.startsWith(`${href}/`));
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => {
            if (menu.current?.open) {
              menu.current.open = false;
              summary.current?.focus();
            }
          }} className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold ${focusClass} ${active ? "bg-[#FFF0E5] text-[#A04100]" : "text-[#263449] hover:bg-[#F0F4FF]"}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-[#F8F9FF] text-[#121C2A] lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-7 border-r border-[#DFE6F3] bg-white p-5 lg:flex">
        <Link href={ROUTES.vendor} className={`font-display text-xl font-bold ${focusClass}`}><span className="text-[#A04100]">Jogja</span>Hub Tenant</Link>
        {navigation}
        <div className="mt-auto space-y-3 border-t border-[#DFE6F3] pt-4">
          <p className="truncate text-sm font-medium">{account}</p>
          <ActionButton onClick={logout}>Keluar</ActionButton>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-[#DFE6F3] bg-white px-4 py-2 lg:hidden">
          <Link href={ROUTES.vendor} className={`font-display font-bold ${focusClass}`}><span className="text-[#A04100]">Jogja</span>Hub Tenant</Link>
          <details ref={menu} className="relative" onKeyDown={(event) => {
            if (event.key === "Escape" && menu.current?.open) {
              menu.current.open = false;
              summary.current?.focus();
            }
          }}>
            <summary ref={summary} className={`flex min-h-11 cursor-pointer list-none items-center rounded-lg border border-[#DFE6F3] px-4 font-semibold ${focusClass}`}>Menu</summary>
            <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] space-y-3 rounded-xl border border-[#DFE6F3] bg-white p-3 shadow-lg">
              {navigation}
              <ActionButton className="w-full" onClick={logout}>Keluar</ActionButton>
            </div>
          </details>
        </header>
        <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
          {query.loading && !profile && <LoadingData />}
          <RequestError message={query.error} retry={query.reload} />
          {profile && (isAccount || profile.status === "approved" ? (
            <PortalProfileContext.Provider value={{ profile, updateProfile: setSaved }}>{children}</PortalProfileContext.Provider>
          ) : (
            <section className="space-y-5">
              <PageHeading title="Portal tenant" />
              <div className={panelClass}>
                <p className="font-semibold">Status toko · {approvalLabel[profile.status]}</p>
                <p className="mt-2 text-sm">Operasi toko tersedia setelah profil disetujui.</p>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <Link href={ROUTES.vendorProfile} className={linkClass}>Buka Manajemen Akun</Link>
                  <ActionButton disabled={query.loading} onClick={() => { setSaved(undefined); query.reload(); }}>Periksa status</ActionButton>
                </div>
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
