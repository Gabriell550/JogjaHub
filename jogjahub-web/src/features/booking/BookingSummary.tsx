import type { BookingResource } from "@/src/types/booking";
import { bookingSchedule, bookingStatusLabels, fundStatusLabels, hasOpenIssue, paymentLabel, rupiah } from "@/src/features/booking/bookingDisplay";

export function BookingSummary({ booking }: { booking: BookingResource }) {
  const fundStatus = booking.payment?.fund_status;
  const details = [
    ["Layanan", booking.service?.name ?? "Layanan"],
    ...(booking.customer ? [["Pelanggan", booking.customer.name], ["Email pelanggan", booking.customer.email], ...(booking.customer.phone ? [["Telepon", booking.customer.phone]] : [])] : []),
    ...(booking.slot !== undefined || booking.check_in_date || booking.demo_pickup ? [["Jadwal", bookingSchedule(booking)]] : []),
    ["Total pesanan", rupiah(booking.total_amount)],
    ["Status pesanan", bookingStatusLabels[booking.status]],
    ["Pembayaran", paymentLabel(booking.payment?.status)],
    ...(fundStatus ? [["Status dana", fundStatusLabels[fundStatus]]] : []),
  ];

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {details.map(([label, value]) => (
        <div key={label} className="min-w-0 break-words">
          <dt className="text-sm text-[#4B596B]">{label}</dt>
          <dd className="font-semibold text-[#121C2A]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CompletionIssue({ booking }: { booking: BookingResource }) {
  if (!booking.issue_reported_at) return null;
  return (
    <section className="space-y-2 rounded-xl bg-[#FFF0E5] p-4 text-[#5A4136]">
      <h2 className="font-semibold">{hasOpenIssue(booking) ? "Kendala sedang ditangani" : "Kendala telah diselesaikan"}</h2>
      {booking.completion_issue && <p className="whitespace-pre-wrap break-words">{booking.completion_issue}</p>}
      {booking.issue_resolution && <p className="whitespace-pre-wrap break-words"><strong className="block">Penyelesaian</strong>{booking.issue_resolution}</p>}
    </section>
  );
}
