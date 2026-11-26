"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/src/constants/routes";
import { ApiError, apiGet, apiPost, type Resource } from "@/src/lib/api";
import { useAuth } from "@/src/hooks/useAuth";
import { requestMessage } from "@/src/hooks/useApiRequest";
import { ActionButton, Field, fieldClass, linkClass, RequestError } from "@/src/components/shared/OperationsUi";
import { orderDate, rupiah } from "@/src/features/booking/bookingDisplay";
import type { BookingResource } from "@/src/types/booking";
import type { Service, TimeSlot } from "@/src/types/service";

type Method = "bank_transfer" | "gopay" | "dana";
const paymentMethods: Record<Method, string> = { bank_transfer: "Transfer bank", gopay: "GoPay", dana: "DANA" };

interface Checkout {
  service_id: number;
  demo_payment_method: Method;
  demo_checkout_key: string;
  demo_expected_amount: number;
  demo_pickup: boolean;
  slot_id?: number;
  check_in_date?: string;
  check_out_date?: string;
}

const dayMs = 86_400_000;

function checkoutKey() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function saveAttempt(key: string, attempt?: Checkout) {
  try {
    if (attempt) sessionStorage.setItem(key, JSON.stringify(attempt));
    else sessionStorage.removeItem(key);
  } catch {
    // The in-memory attempt still supports retry when storage is unavailable.
  }
}

export function ServiceBookingPanel({ service }: { service: Service }) {
  const { session, isHydrated, logout } = useAuth();
  const router = useRouter();
  const [quote, setQuote] = useState(service);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [availabilityError, setAvailabilityError] = useState("");
  const [loading, setLoading] = useState(Boolean(service.is_accommodation || service.subcategory?.requires_time_slot));
  const [refresh, setRefresh] = useState(0);
  const [slot, setSlot] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [method, setMethod] = useState<Method>("bank_transfer");
  const [pickup, setPickup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [reviewQuote, setReviewQuote] = useState(false);
  const [recovery, setRecovery] = useState<{ key: string; attempt?: Checkout }>();
  const lock = useRef(false);
  const storageKey = session?.user.role === "customer" ? `jogjahub_checkout_${session.user.id}_${service.id}` : null;
  const uncertain = recovery?.key === storageKey ? recovery.attempt : undefined;
  const restoring = Boolean(storageKey && recovery?.key !== storageKey);
  const isHotel = Boolean(quote.is_accommodation);
  const requiresSlot = Boolean(quote.subcategory?.requires_time_slot);
  const scheduled = isHotel || requiresSlot;
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta" }).format(new Date());
  const nights = checkIn && checkOut && checkOut > checkIn ? (Date.parse(checkOut) - Date.parse(checkIn)) / dayMs : 0;
  const amount = Math.trunc(Number(quote.price)) * (quote.price_type === "per_night" && isHotel ? nights : 1);

  useEffect(() => {
    if (!storageKey) return;
    const timer = window.setTimeout(() => {
      let attempt: Checkout | undefined;
      try {
        const stored = sessionStorage.getItem(storageKey);
        if (stored) attempt = JSON.parse(stored) as Checkout;
      } catch {
        // Checkout remains available if storage cannot be read.
      }
      setRecovery({ key: storageKey, attempt });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadAvailability() {
      const current = refresh
        ? (await apiGet<Resource<Service>>(`/services/${service.id}`, controller.signal)).data
        : service;
      const needsSlots = current.is_accommodation || current.subcategory?.requires_time_slot;
      const available = needsSlots
        ? (await apiGet<Resource<TimeSlot[]>>(`/services/${service.id}/slots`, controller.signal)).data
        : [];
      if (controller.signal.aborted) return;
      setQuote(current);
      setSlots(available);
    }
    void loadAvailability().catch((error: unknown) => {
      if (!controller.signal.aborted) setAvailabilityError(requestMessage(error));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [refresh, service]);

  function reloadQuote() {
    setAvailabilityError("");
    setLoading(true);
    setRefresh((value) => value + 1);
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || !storageKey || restoring) return;
    setBookingError("");

    if (!uncertain && isHotel) {
      const dates = new Set(slots.map((item) => item.slot_date));
      if (!nights || checkIn < today || nights > dates.size ||
        Array.from({ length: nights }, (_, index) => new Date(Date.parse(checkIn) + index * dayMs).toISOString().slice(0, 10))
          .some((date) => !dates.has(date))) {
        setBookingError("Pilih rentang inap dengan slot tersedia untuk setiap malam.");
        return;
      }
    } else if (!uncertain && requiresSlot && !slots.some((item) => String(item.id) === slot)) {
      setBookingError("Pilih slot waktu yang tersedia.");
      return;
    }

    const payload = uncertain ?? {
      service_id: service.id,
      demo_payment_method: method,
      demo_checkout_key: checkoutKey(),
      demo_expected_amount: amount,
      demo_pickup: !scheduled && pickup,
      ...(isHotel ? { check_in_date: checkIn, check_out_date: checkOut } : requiresSlot ? { slot_id: Number(slot) } : {}),
    };

    lock.current = true;
    setSubmitting(true);
    saveAttempt(storageKey, payload);
    try {
      const response = await apiPost<Resource<BookingResource>>("/customer/bookings", payload, AbortSignal.timeout(20_000));
      if (!response.data?.uuid) throw new Error("Respons checkout tidak memuat nomor pesanan.");
      saveAttempt(storageKey);
      router.replace(`${ROUTES.dashboardOrders}/${response.data.uuid}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        setBookingError("Sesi berakhir. Silakan masuk kembali.");
      } else if (error instanceof ApiError && error.status === 422) {
        saveAttempt(storageKey);
        setRecovery({ key: storageKey });
        setReviewQuote(true);
        setBookingError(requestMessage(error));
        reloadQuote();
      } else if (error instanceof ApiError && error.status < 500 && error.status !== 408 && error.status !== 429) {
        saveAttempt(storageKey);
        setRecovery({ key: storageKey });
        setBookingError(requestMessage(error));
      } else {
        setRecovery({ key: storageKey, attempt: payload });
        setBookingError("Hasil pembayaran belum diketahui. Coba lagi untuk memeriksa checkout yang sama.");
      }
      lock.current = false;
      setSubmitting(false);
    }
  }

  if (!isHydrated) return <p role="status" className="mt-6">Memeriksa sesi...</p>;

  if (!session) return (
    <div className="mt-6 rounded-xl bg-[#F0F4FF] p-4">
      <RequestError message={bookingError} />
      <p>Masuk sebagai customer untuk memesan layanan ini.</p>
      <Link href={`${ROUTES.login}?role=customer`} className={linkClass}>Masuk untuk memesan</Link>
    </div>
  );

  if (session.user.role !== "customer") return <p className="mt-6">Booking layanan hanya tersedia untuk akun customer.</p>;

  return (
    <section className="mt-7 space-y-3 rounded-2xl border border-[#DFE6F3] bg-[#F8FAFF] p-4 sm:p-6">
      <h2 className="font-display text-xl font-semibold">Pesan layanan ini</h2>
      <p className="text-sm text-[#5A4136]">Mode demo · Pembayaran dan pencairan disimulasikan</p>
      <RequestError message={bookingError} />
      <RequestError message={availabilityError} retry={reloadQuote} />
      {loading && <p role="status">Memuat ketersediaan...</p>}
      {uncertain ? (
        <form onSubmit={submitBooking} className="space-y-3">
          <p className="text-sm">Checkout ini masih menunggu kepastian. Coba lagi untuk memeriksa checkout yang sama.</p>
          <p className="font-semibold">{paymentMethods[uncertain.demo_payment_method]} · {rupiah(uncertain.demo_expected_amount)}</p>
          <ActionButton type="submit" className="w-full" disabled={submitting}>{submitting ? "Memproses..." : "Coba lagi checkout yang sama"}</ActionButton>
        </form>
      ) : !restoring && !loading && !availabilityError && (
        <form onSubmit={submitBooking} className="space-y-4">
          <fieldset disabled={submitting} className="min-w-0 space-y-4">
            {isHotel ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Check-in"><input className={fieldClass} type="date" min={today} value={checkIn} onChange={(event) => setCheckIn(event.target.value)} required /></Field>
                <Field label="Check-out"><input className={fieldClass} type="date" min={checkIn || today} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} required /></Field>
              </div>
            ) : requiresSlot ? (
              <Field label="Tanggal dan waktu">
                <select className={fieldClass} value={slot} onChange={(event) => setSlot(event.target.value)} required>
                  <option value="">Pilih slot tersedia</option>
                  {slots.map((item) => (
                    <option key={item.id} value={item.id}>{orderDate(item.slot_date)} · {item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)} WIB · Sisa {item.available}</option>
                  ))}
                </select>
              </Field>
            ) : (
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={pickup} onChange={(event) => setPickup(event.target.checked)} /> Ambil sendiri</label>
            )}
            {scheduled && !slots.length && <p className="text-sm">Belum ada jadwal yang tersedia.</p>}
            <Field label="Metode pembayaran">
              <select className={fieldClass} value={method} onChange={(event) => setMethod(event.target.value as Method)}>
                {Object.entries(paymentMethods).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
          </fieldset>
          <p className="font-semibold" aria-live="polite">Total {isHotel && !nights ? "—" : rupiah(amount)} {isHotel && nights > 0 && <span className="text-sm font-normal">· {nights} malam</span>}</p>
          {reviewQuote && <p role="status" className="text-sm">Periksa harga dan jadwal terbaru sebelum mengonfirmasi checkout.</p>}
          <ActionButton type="submit" className="w-full" disabled={submitting || (scheduled && !slots.length)}>
            {submitting ? "Memproses..." : "Simulasikan Pembayaran"}
          </ActionButton>
        </form>
      )}
      <Link href={ROUTES.dashboardOrders} className={linkClass}>Lihat pesanan saya</Link>
    </section>
  );
}
