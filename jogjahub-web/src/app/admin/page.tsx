"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/src/features/admin/services/adminApi";
import type { AdminBooking, DashboardSummary } from "@/src/features/admin/types";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentBookings, setRecentBookings] = useState<AdminBooking[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [summaryRes, bookingsRes] = await Promise.all([adminApi.getSummary(), adminApi.getBookings()]);
        if (!active) return;
        setSummary(summaryRes.data);
        setRecentBookings(adminApi.unwrapList(bookingsRes.data).slice(0, 5));
      } catch (err) {
        console.log("Gagal memuat dashboard admin:", err);
      }
    }

    load();
    // Polling tiap 30 detik sebagai pengganti WebSocket (backend belum punya broadcasting).
    const interval = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const cards = summary
    ? [
        { label: "Total Customer", value: summary.customers_total, color: "bg-[#EFF4FF] text-[#1E3A8A]" },
        { label: "Total Tenant", value: summary.tenants_total, color: "bg-[#F3E8FF] text-[#6B21A8]" },
        { label: "Tenant Pending", value: summary.tenants_pending, color: "bg-[#FFF0E5] text-[#A04100]" },
        { label: "Tenant Approved", value: summary.tenants_approved, color: "bg-[#E6F4EA] text-[#1E7B34]" },
        { label: "Booking Pending", value: summary.bookings_pending, color: "bg-[#FFF8E1] text-[#8A6D00]" },
        { label: "Booking Confirmed", value: summary.bookings_confirmed, color: "bg-[#EFF4FF] text-[#1E3A8A]" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-[#121C2A]">Dashboard Admin</h1>

      <div className="rounded-2xl border border-[#D3E2ED] bg-white p-6">
        <p className="text-sm text-[#5A4136]">Booking hari ini</p>
        <p className="font-display mt-1 text-4xl font-bold text-[#121C2A]">{summary?.bookings_today ?? "-"}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-2xl p-5 ${card.color}`}>
            <p className="text-sm font-medium">{card.label}</p>
            <p className="font-display mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#D3E2ED] bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-[#121C2A]">Transaksi Terbaru</h2>
        <ul className="mt-4 divide-y divide-[#E6EEFF]">
          {recentBookings.map((booking) => (
            <li key={booking.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium text-[#121C2A]">{booking.service?.name ?? "-"}</p>
                <p className="text-[#5A4136]">{booking.customer?.name ?? "-"} · {booking.service?.tenant?.business_name ?? "-"}</p>
              </div>
              <span className="rounded-full bg-[#F8F9FF] px-3 py-1 text-xs font-semibold text-[#121C2A]">{booking.status}</span>
            </li>
          ))}
          {recentBookings.length === 0 ? <p className="py-4 text-sm text-[#5A4136]">Belum ada transaksi.</p> : null}
        </ul>
      </div>
    </div>
  );
}
