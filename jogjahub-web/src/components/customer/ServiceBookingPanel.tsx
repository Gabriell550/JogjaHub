"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ROUTES } from "@/src/constants/routes";
import { apiGet, apiPost } from "@/src/lib/api";
import { useAuth } from "@/src/hooks/useAuth";
import type { ServiceCategory, TimeSlot } from "@/src/types/service";

interface CategoriesResponse {
  success: boolean;
  data: ServiceCategory[];
}

interface SlotsResponse {
  success: boolean;
  data: TimeSlot[];
}

interface BookingResponse {
  success: boolean;
  message: string;
  data: { uuid: string };
  payment_url: string | null;
  expires_at: string | null;
}

interface ServiceBookingPanelProps {
  serviceId: number;
  subcategoryId?: number;
}

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function containsUnavailableNight(checkIn: string, checkOut: string, availableDates: Set<string>) {
  const date = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  while (date < end) {
    if (!availableDates.has(date.toISOString().slice(0, 10))) return true;
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return false;
}

export function ServiceBookingPanel({ serviceId, subcategoryId }: ServiceBookingPanelProps) {
  const { session, isHydrated } = useAuth();
  const [requiresSlot, setRequiresSlot] = useState<boolean | null>(null);
  const [isHotel, setIsHotel] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilityRequest, setAvailabilityRequest] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingNotice, setBookingNotice] = useState("");
  const submissionLock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const categoriesRequest = subcategoryId
      ? apiGet<CategoriesResponse>("/categories", controller.signal)
      : Promise.reject(new Error("Kategori layanan tidak tersedia, sehingga kebutuhan jadwal booking tidak dapat ditentukan."));
    categoriesRequest
      .then(async (response) => {
        const category = response.data.find((item) => item.subcategories.some((subcategory) => subcategory.id === subcategoryId));
        const subcategory = category?.subcategories.find((item) => item.id === subcategoryId);
        if (!category || !subcategory || typeof subcategory.requires_time_slot !== "boolean") {
          throw new Error("Informasi jadwal kategori ini belum tersedia.");
        }

        const hotelCategory = category.name.toLocaleLowerCase("id-ID").includes("penginapan");
        setRequiresSlot(subcategory.requires_time_slot);
        setIsHotel(hotelCategory);

        if (subcategory.requires_time_slot || hotelCategory) {
          const slotResponse = await apiGet<SlotsResponse>(`/services/${serviceId}/slots`, controller.signal);
          setSlots(slotResponse.data);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setAvailabilityError(error instanceof Error ? error.message : "Informasi jadwal gagal dimuat.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingAvailability(false);
      });

    return () => controller.abort();
  }, [availabilityRequest, serviceId, subcategoryId]);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current) return;
    setBookingError("");
    setBookingNotice("");

    if (isHotel) {
      if (!checkIn || !checkOut || checkOut <= checkIn) {
        setBookingError("Pilih tanggal check-in dan check-out. Check-out harus setelah check-in.");
        return;
      }
      const availableDates = new Set(slots.map((slot) => slot.slot_date));
      if (containsUnavailableNight(checkIn, checkOut, availableDates)) {
        setBookingError("Ada malam yang belum memiliki slot tersedia. Pilih rentang tanggal lain.");
        return;
      }
    } else if (requiresSlot && !selectedSlot) {
      setBookingError("Pilih salah satu slot waktu yang tersedia.");
      return;
    }

    submissionLock.current = true;
    setSubmitting(true);
    try {
      const payload: {
        service_id: number;
        slot_id?: number;
        check_in_date?: string;
        check_out_date?: string;
      } = { service_id: serviceId };
      if (isHotel) {
        payload.check_in_date = checkIn;
        payload.check_out_date = checkOut;
      } else if (requiresSlot) {
        payload.slot_id = Number(selectedSlot);
      }

      const response = await apiPost<BookingResponse>("/customer/bookings", payload);
      if (response.payment_url) {
        window.location.assign(response.payment_url);
        return;
      }

      setBookingNotice(`Booking ${response.data.uuid} berhasil dibuat, tetapi backend tidak mengembalikan tautan pembayaran.`);
    } catch (error: unknown) {
      setBookingError(error instanceof Error ? error.message : "Booking gagal dibuat. Silakan coba lagi.");
      setLoadingAvailability(true);
      setAvailabilityRequest((request) => request + 1);
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  if (!isHydrated) {
    return <p role="status" className="mt-6 rounded-xl bg-[#F0F4FF] p-4 text-sm text-[#4B596B]">Memeriksa sesi...</p>;
  }

  if (!session) {
    return (
      <div className="mt-6 rounded-2xl border border-[#DFE6F3] bg-[#F8FAFF] p-5">
        <p className="text-sm leading-6 text-[#263449]">Masuk sebagai customer untuk memesan layanan ini.</p>
        <Link href={`${ROUTES.login}?role=customer`} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[#FF6B00] px-5 text-sm font-bold text-[#121C2A] hover:bg-[#E85F00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Masuk untuk booking</Link>
      </div>
    );
  }

  if (session.user.role !== "customer") {
    return <p className="mt-6 rounded-xl bg-[#F0F4FF] p-4 text-sm leading-6 text-[#263449]">Booking layanan hanya tersedia untuk akun customer.</p>;
  }

  return (
    <div className="mt-7 rounded-2xl border border-[#DFE6F3] bg-[#F8FAFF] p-5 sm:p-6">
      <h2 className="font-display text-xl font-semibold text-[#121C2A]">Pesan layanan ini</h2>
      <p className="mt-1 text-sm leading-6 text-[#4B596B]">Ketersediaan jadwal diperiksa langsung dari data vendor.</p>

      {loadingAvailability ? <p role="status" className="mt-4 text-sm text-[#4B596B]">Memuat ketersediaan...</p> : null}
      {availabilityError ? (
        <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>{availabilityError}</p>
          <button type="button" onClick={() => { setAvailabilityError(""); setLoadingAvailability(true); setAvailabilityRequest((request) => request + 1); }} className="mt-2 min-h-11 font-semibold underline underline-offset-2">Coba lagi</button>
        </div>
      ) : null}

      {!loadingAvailability && !availabilityError && requiresSlot === false && !isHotel ? (
        <form onSubmit={submitBooking} className="mt-4">
          <p className="rounded-lg bg-white p-3 text-sm text-[#263449]">Layanan ini tidak memerlukan pemilihan slot waktu.</p>
          {bookingError ? <p role="alert" className="mt-3 text-sm font-medium text-red-800">{bookingError}</p> : null}
          {bookingNotice ? <p role="status" className="mt-3 text-sm font-medium text-green-800">{bookingNotice}</p> : null}
          <button type="submit" disabled={submitting} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#FF6B00] px-5 font-bold text-[#121C2A] transition hover:bg-[#E85F00] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">
            {submitting ? "Memproses booking..." : "Booking dan lanjutkan pembayaran"}
          </button>
        </form>
      ) : null}

      {!loadingAvailability && !availabilityError && isHotel ? (
        <form onSubmit={submitBooking} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-[#263449]">
              Check-in
              <input type="date" min={localDateString(new Date())} value={checkIn} onChange={(event) => setCheckIn(event.target.value)} required className="mt-2 min-h-11 w-full rounded-lg border border-[#B8C2D3] bg-white px-3 text-[#121C2A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]" />
            </label>
            <label className="block text-sm font-medium text-[#263449]">
              Check-out
              <input type="date" min={checkIn || localDateString(new Date())} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} required className="mt-2 min-h-11 w-full rounded-lg border border-[#B8C2D3] bg-white px-3 text-[#121C2A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]" />
            </label>
          </div>
          <p className="text-xs leading-5 text-[#4B596B]">Setiap malam dalam rentang inap harus memiliki slot kamar tersedia. Ketersediaan akan divalidasi kembali oleh backend saat booking. Jika koneksi terputus saat mengirim, periksa halaman pesanan sebelum mencoba lagi.</p>
          {bookingError ? <p role="alert" className="text-sm font-medium text-red-800">{bookingError}</p> : null}
          {bookingNotice ? <p role="status" className="text-sm font-medium text-green-800">{bookingNotice}</p> : null}
          <button type="submit" disabled={submitting || slots.length === 0} className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#FF6B00] px-5 font-bold text-[#121C2A] transition hover:bg-[#E85F00] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">
            {submitting ? "Memproses booking..." : slots.length === 0 ? "Tidak ada tanggal tersedia" : "Booking dan lanjutkan pembayaran"}
          </button>
        </form>
      ) : null}

      {!loadingAvailability && !availabilityError && requiresSlot && !isHotel ? (
        <form onSubmit={submitBooking} className="mt-4">
          {slots.length === 0 ? (
            <p className="rounded-lg bg-white p-3 text-sm text-[#4B596B]">Belum ada slot waktu yang tersedia untuk layanan ini.</p>
          ) : (
            <label className="block text-sm font-medium text-[#263449]">
              Pilih tanggal dan waktu
              <select value={selectedSlot} onChange={(event) => setSelectedSlot(event.target.value)} required className="mt-2 min-h-11 w-full rounded-lg border border-[#B8C2D3] bg-white px-3 text-[#121C2A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">
                <option value="">Pilih slot tersedia</option>
                {slots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(`${slot.slot_date}T00:00:00`))} · {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)} · Sisa {slot.available}
                  </option>
                ))}
              </select>
            </label>
          )}
          {bookingError ? <p role="alert" className="mt-3 text-sm font-medium text-red-800">{bookingError}</p> : null}
          {bookingNotice ? <p role="status" className="mt-3 text-sm font-medium text-green-800">{bookingNotice}</p> : null}
          <button type="submit" disabled={submitting || slots.length === 0} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#FF6B00] px-5 font-bold text-[#121C2A] transition hover:bg-[#E85F00] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">
            {submitting ? "Memproses booking..." : "Booking dan lanjutkan pembayaran"}
          </button>
        </form>
      ) : null}

      <Link href={ROUTES.dashboardOrders} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#A04100] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Lihat pesanan saya</Link>
    </div>
  );
}
