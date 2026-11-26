import type { BookingResource, BookingStatus, FundStatus } from "@/src/types/booking";

export const bookingStatusLabels: Record<BookingStatus, string> = {
  pending: "Menunggu konfirmasi",
  confirmed: "Dikonfirmasi",
  awaiting_completion_confirmation: "Menunggu konfirmasi selesai",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const fundStatusLabels: Record<FundStatus, string> = {
  held: "Ditahan",
  processing: "Dalam pencairan",
  simulated: "Pencairan disimulasikan",
  failed: "Pencairan bermasalah",
};

const paymentLabels: Record<string, string> = {
  pending: "Menunggu pembayaran",
  paid: "Dibayar",
  expired: "Kedaluwarsa",
  failed: "Gagal",
  cancelled: "Dibatalkan",
};

export function paymentLabel(status: string | null | undefined) {
  return status ? (paymentLabels[status.toLowerCase()] ?? status) : "Belum tersedia";
}

export function bookingCode(id: number) {
  return `JH-${String(id).padStart(4, "0")}`;
}

export function rupiah(amount: number | string | null | undefined) {
  return amount == null ? "Belum tersedia" : `Rp${Number(amount).toLocaleString("id-ID")}`;
}

export function orderDate(value: string) {
  const date = new Date(value.length === 10 ? `${value}T00:00:00+07:00` : value);
  return Number.isNaN(date.getTime()) ? value
    : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(date);
}

export function bookingSchedule(booking: BookingResource) {
  if (booking.check_in_date && booking.check_out_date) {
    return `${orderDate(booking.check_in_date)} – ${orderDate(booking.check_out_date)}${booking.nights ? ` · ${booking.nights} malam` : ""}`;
  }
  if (booking.slot) {
    const { slot_date, start_time, end_time } = booking.slot;
    return `${orderDate(slot_date)} · ${start_time.slice(0, 5)}–${end_time.slice(0, 5)} WIB`;
  }
  return booking.demo_pickup ? "Ambil sendiri" : "Tanpa jadwal";
}

export const hasOpenIssue = (booking: BookingResource) => Boolean(booking.issue_reported_at && !booking.issue_resolved_at);
