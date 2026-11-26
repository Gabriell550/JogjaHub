"use client";

import Link from "next/link";
import { ROUTES } from "@/src/constants/routes";
import { usePortalProfile } from "@/src/features/vendor/portalProfile";
import { useApiQuery } from "@/src/hooks/useApiRequest";
import { VendorBookingList } from "@/src/features/vendor/VendorBookingList";
import { linkClass, LoadingData, PageHeading, panelClass, RequestError } from "@/src/components/shared/OperationsUi";
import type { Page } from "@/src/lib/api";
import type { BookingResource } from "@/src/types/booking";
import type { Service } from "@/src/types/service";

export default function VendorDashboard() {
  const { profile } = usePortalProfile();
  const services = useApiQuery<Page<Service>>("/tenant/services");
  const orders = useApiQuery<Page<BookingResource>>("/tenant/bookings");

  return (
    <section className="space-y-6">
      <PageHeading title="Dashboard" />
      <p className="break-words text-lg font-semibold text-[#5A4136]">{profile.business_name}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={panelClass}>
          <p className="text-sm text-[#4B596B]">Jumlah layanan</p>
          <p className="mt-1 text-3xl font-bold">{services.data?.meta.total ?? "—"}</p>
          {services.loading && <p role="status" className="text-sm">Memuat layanan...</p>}
          <RequestError message={services.error} retry={services.reload} />
          <Link href={ROUTES.vendorServices} className={linkClass}>Kelola layanan</Link>
        </div>
        <div className={panelClass}>
          <p className="text-sm text-[#4B596B]">Jumlah pesanan</p>
          <p className="mt-1 text-3xl font-bold">{orders.data?.meta.total ?? "—"}</p>
          <Link href={ROUTES.vendorEarnings} className={linkClass}>Pendapatan</Link>
        </div>
      </div>
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">Pesanan terbaru</h2>
          <Link href={ROUTES.vendorOrders} className={linkClass}>Lihat semua pesanan</Link>
        </div>
        {orders.loading && <LoadingData />}
        <RequestError message={orders.error} retry={orders.reload} />
        {orders.data && <VendorBookingList bookings={orders.data.data.slice(0, 5)} />}
      </section>
    </section>
  );
}
