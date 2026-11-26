import Link from "next/link";
import { ROUTES } from "@/src/constants/routes";
import { bookingCode, bookingSchedule, bookingStatusLabels, paymentLabel, rupiah } from "@/src/features/booking/bookingDisplay";
import { linkClass, panelClass } from "@/src/components/shared/OperationsUi";
import type { BookingResource } from "@/src/types/booking";

export function VendorBookingList({ bookings }: { bookings: BookingResource[] }) {
  if (!bookings.length) return <p className={panelClass}>Belum ada pesanan.</p>;

  return (
    <ul className="space-y-3">
      {bookings.map((booking) => (
        <li key={booking.uuid} className={`${panelClass} grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]`}>
          <div className="min-w-0">
            <Link href={`${ROUTES.vendorOrders}/${booking.uuid}`} className={linkClass}>{bookingCode(booking.id)}</Link>
            <p className="break-words font-semibold">{booking.service?.name ?? "Layanan"}</p>
            {booking.customer?.name && <p className="mt-1 break-words text-sm text-[#4B596B]">{booking.customer.name}</p>}
            <p className="mt-1 text-sm text-[#4B596B]">{bookingSchedule(booking)}</p>
          </div>
          <div className="space-y-1 text-sm sm:text-right">
            <p className="font-bold">{rupiah(booking.total_amount)}</p>
            <p className="font-semibold">{bookingStatusLabels[booking.status]}</p>
            {booking.payment?.status && <p className="text-[#4B596B]">Pembayaran · {paymentLabel(booking.payment.status)}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
