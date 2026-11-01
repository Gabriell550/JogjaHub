"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/src/lib/api";
import { ROUTES } from "@/src/constants/routes";
import type { Service, TimeSlot } from "@/src/types/service";

type BookingStatus = "pending" | "confirmed" | "cancelled";
type BookingsView = "active" | "history";

interface CustomerBooking {
  id: number;
  uuid: string;
  status: BookingStatus;
  details: Record<string, unknown> | null;
  created_at: string;
  service: Service;
  slot: TimeSlot | null;
}

interface BookingListResponse {
  success: boolean;
  data: CustomerBooking[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

const statusLabels: Record<BookingStatus, string> = {
  pending: "Menunggu pembayaran",
  confirmed: "Dikonfirmasi",
  cancelled: "Dibatalkan",
};

const PAGE_SIZE = 15;

function formattedDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(value));
}

export function CustomerBookingsPage({ view }: { view: BookingsView }) {
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestNumber, setRequestNumber] = useState(0);
  const isHistory = view === "history";

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      const loadBookings = async () => {
        setLoading(true);
        setError("");

        try {
          const firstPage = await apiGet<BookingListResponse>("/customer/bookings?page=1", controller.signal);
          const allBookings = [...firstPage.data];

          for (let currentPage = 2; currentPage <= firstPage.meta.last_page; currentPage += 1) {
            if (controller.signal.aborted) return;
            const response = await apiGet<BookingListResponse>(`/customer/bookings?page=${currentPage}`, controller.signal);
            allBookings.push(...response.data);
          }

          if (!controller.signal.aborted) setBookings(allBookings);
        } catch (requestError: unknown) {
          if (!controller.signal.aborted) {
            setError(requestError instanceof Error ? requestError.message : "Pesanan gagal dimuat.");
          }
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      };

      void loadBookings();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [requestNumber]);

  const visibleBookings = bookings.filter((booking) => isHistory
    ? booking.status === "cancelled"
    : booking.status === "pending" || booking.status === "confirmed");
  const pageCount = Math.max(1, Math.ceil(visibleBookings.length / PAGE_SIZE));
  const pageBookings = visibleBookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#A04100]">Akun customer</p>
          <h1 className="font-display mt-2 text-3xl font-bold text-[#121C2A]">{isHistory ? "Riwayat" : "Pesanan Saya"}</h1>
          <p className="mt-2 text-sm text-[#4B596B]">
            {isHistory
              ? "Pesanan yang dibatalkan berdasarkan status dari backend."
              : "Pesanan aktif yang menunggu pembayaran atau sudah dikonfirmasi."}
          </p>
        </div>
        <Link href={ROUTES.dashboard} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#B8C2D3] bg-white px-4 text-sm font-semibold text-[#263449] hover:bg-[#F8F9FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Jelajahi layanan</Link>
      </div>

      {loading ? (
        <div role="status" aria-live="polite" className="rounded-2xl border border-[#DFE6F3] bg-white p-10 text-center text-[#4B596B]">Memuat pesanan...</div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="font-display text-lg font-semibold text-red-800">{isHistory ? "Riwayat belum dapat dimuat" : "Pesanan belum dapat dimuat"}</h2>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button type="button" onClick={() => { setLoading(true); setError(""); setRequestNumber((current) => current + 1); }} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#A04100] px-5 font-semibold text-white hover:bg-[#7B3200] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Coba lagi</button>
        </div>
      ) : pageBookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#B8C2D3] bg-white p-10 text-center">
          <h2 className="font-display text-xl font-semibold text-[#121C2A]">{isHistory ? "Belum ada riwayat pembatalan" : "Belum ada pesanan aktif"}</h2>
          <p className="mt-2 text-sm text-[#4B596B]">{isHistory ? "Pesanan yang dibatalkan akan muncul di sini." : "Booking yang masih berjalan akan muncul di sini."}</p>
          {!isHistory ? <Link href={ROUTES.dashboard} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#FF6B00] px-5 text-sm font-bold text-[#121C2A] hover:bg-[#E85F00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Cari layanan</Link> : null}
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {pageBookings.map((booking) => {
              const details = booking.details ?? {};
              const checkIn = typeof details.check_in_date === "string" ? details.check_in_date : null;
              const checkOut = typeof details.check_out_date === "string" ? details.check_out_date : null;
              return (
                <li key={booking.uuid} className="rounded-2xl border border-[#DFE6F3] bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#5A6472]">Booking #{booking.uuid.slice(0, 8)}</p>
                      <h2 className="font-display mt-2 text-lg font-semibold text-[#121C2A]">{booking.service.name}</h2>
                      <p className="mt-1 text-sm text-[#4B596B]">{booking.service.tenant?.business_name ?? "Vendor JogjaHub"}</p>
                    </div>
                    <span className={`inline-flex min-h-8 w-fit items-center rounded-full px-3 text-xs font-bold ${
                      booking.status === "confirmed" ? "bg-green-100 text-green-900" :
                        booking.status === "cancelled" ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-900"
                    }`}>{statusLabels[booking.status]}</span>
                  </div>
                  <div className="mt-4 grid gap-2 border-t border-[#E6EEFF] pt-4 text-sm text-[#263449] sm:grid-cols-2">
                    <p><span className="font-semibold">Harga layanan:</span> Rp{Number(booking.service.price).toLocaleString("id-ID")}</p>
                    <p><span className="font-semibold">Dibuat:</span> {formattedDate(booking.created_at)}</p>
                    {booking.slot ? <p><span className="font-semibold">Jadwal:</span> {formattedDate(booking.slot.slot_date)} · {booking.slot.start_time.slice(0, 5)}–{booking.slot.end_time.slice(0, 5)}</p> : null}
                    {checkIn && checkOut ? <p><span className="font-semibold">Check-in/out:</span> {formattedDate(checkIn)} – {formattedDate(checkOut)}</p> : null}
                  </div>
                  <Link href={`${ROUTES.services}/${booking.service.id}`} className="mt-4 inline-flex min-h-11 items-center font-semibold text-[#A04100] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Lihat detail layanan</Link>
                </li>
              );
            })}
          </ul>
          {pageCount > 1 ? (
            <nav aria-label={isHistory ? "Halaman riwayat pesanan" : "Halaman pesanan"} className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="min-h-11 rounded-lg border border-[#B8C2D3] bg-white px-4 text-sm font-semibold text-[#121C2A] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Sebelumnya</button>
              <span aria-live="polite" className="text-sm text-[#263449]">Halaman {page} dari {pageCount}</span>
              <button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="min-h-11 rounded-lg bg-[#0F172A] px-4 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Selanjutnya</button>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}
