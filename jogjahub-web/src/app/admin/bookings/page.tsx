"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/src/features/admin/services/adminApi";
import type { AdminBooking } from "@/src/features/admin/types";

type StatusFilter = "all" | "pending" | "confirmed" | "cancelled";

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

const statusStyles: Record<string, string> = {
  pending: "bg-[#FFF8E1] text-[#8A6D00]",
  confirmed: "bg-[#E6F4EA] text-[#1E7B34]",
  cancelled: "bg-[#FDE8E8] text-[#BA1A1A]",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      try {
        // Filter status beneran dikirim ke backend (Admin/BookingController@index).
        const res = await adminApi.getBookings(status === "all" ? undefined : { status });
        if (!active) return;
        setBookings(adminApi.unwrapList(res.data));
      } catch (err) {
        console.log("Gagal memuat booking:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadBookings();
    // Polling tiap 20 detik sebagai pengganti WebSocket (backend belum punya broadcasting).
    const interval = setInterval(loadBookings, 20000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-[#121C2A]">Monitoring Transaksi</h1>
        <label className="flex items-center gap-2 text-sm text-[#5A4136]">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="min-h-10 rounded-md border border-[#8E7164]/50 bg-white px-3 text-sm text-[#121C2A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#D3E2ED] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#E6EEFF] text-[#5A4136]">
            <tr>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Layanan</th>
              <th className="p-4 font-medium">Vendor</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EEFF]">
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="p-4 text-[#121C2A]">{booking.customer?.name ?? "-"}</td>
                <td className="p-4 text-[#5A4136]">{booking.service?.name ?? "-"}</td>
                <td className="p-4 text-[#5A4136]">{booking.service?.tenant?.business_name ?? "-"}</td>
                <td className="p-4">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[booking.status] ?? "bg-[#F8F9FF] text-[#121C2A]"}`}>{booking.status}</span>
                </td>
                <td className="p-4 text-[#5A4136]">{formatDate(booking.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && bookings.length === 0 ? <p className="p-6 text-center text-sm text-[#5A4136]">Tidak ada transaksi{status !== "all" ? ` dengan status ${status}` : ""}.</p> : null}
        {isLoading ? <p className="p-6 text-center text-sm text-[#5A4136]">Memuat...</p> : null}
      </div>
    </div>
  );
}
