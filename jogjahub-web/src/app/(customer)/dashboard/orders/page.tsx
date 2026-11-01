"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/src/lib/api";
import { ROUTES } from "@/src/constants/routes";
import type { Service, TimeSlot } from "@/src/types/service";

type BookingStatus = "pending" | "confirmed" | "cancelled";

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
  meta: { current_page: number; last_page: number; total: number };
}

const statusLabels: Record<BookingStatus, string> = {
  pending: "Menunggu pembayaran",
  confirmed: "Dikonfirmasi",
  cancelled: "Dibatalkan",
};

function formattedDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(value));
}

export default function CustomerOrdersPage() {
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [pagination, setPagination] = useState<BookingListResponse["meta"] | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestNumber, setRequestNumber] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError("");
      apiGet<BookingListResponse>(`/customer/bookings?page=${page}`, controller.signal)
        .then((response) => {
          setBookings(response.data);
          setPagination(response.meta);
        })
        .catch((requestError: unknown) => {
          if (!controller.signal.aborted) {
            setError(requestError instanceof Error ? requestError.message : "Riwayat pesanan gagal dimuat.");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [page, requestNumber]);

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#A04100]">Akun customer</p>
          <h1 className="font-display mt-2 text-3xl font-bold text-[#121C2A]">Pesanan saya</h1>
          <p className="mt-2 text-sm text-[#4B596B]">Riwayat booking dan status terbaru dari backend.</p>
        </div>
        <Link href={ROUTES.dashboard} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#B8C2D3] bg-white px-4 text-sm font-semibold text-[#263449] hover:bg-[#F8F9FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Jelajahi layanan</Link>
      </div>

      {loading ? (
        <div role="status" aria-live="polite" className="rounded-2xl border border-[#DFE6F3] bg-white p-10 text-center text-[#4B596B]">Memuat pesanan...</div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="font-display text-lg font-semibold text-red-800">Riwayat belum dapat dimuat</h2>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button type="button" onClick={() => { setLoading(true); setError(""); setRequestNumber((current) => current + 1); }} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#A04100] px-5 font-semibold text-white hover:bg-[#7B3200] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Coba lagi</button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#B8C2D3] bg-white p-10 text-center">
          <h2 className="font-display text-xl font-semibold text-[#121C2A]">Belum ada pesanan</h2>
          <p className="mt-2 text-sm text-[#4B596B]">Booking yang kamu buat akan muncul di sini.</p>
          <Link href={ROUTES.dashboard} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#FF6B00] px-5 text-sm font-bold text-[#121C2A] hover:bg-[#E85F00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Cari layanan</Link>
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {bookings.map((booking) => {
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
                    }`}>{statusLabels[booking.status] ?? booking.status}</span>
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
          {pagination && pagination.last_page > 1 ? (
            <nav aria-label="Halaman riwayat pesanan" className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="min-h-11 rounded-lg border border-[#B8C2D3] bg-white px-4 text-sm font-semibold text-[#121C2A] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Sebelumnya</button>
              <span aria-live="polite" className="text-sm text-[#263449]">Halaman {pagination.current_page} dari {pagination.last_page}</span>
              <button type="button" disabled={page >= pagination.last_page} onClick={() => setPage((current) => Math.min(pagination.last_page, current + 1))} className="min-h-11 rounded-lg bg-[#0F172A] px-4 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Selanjutnya</button>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}
