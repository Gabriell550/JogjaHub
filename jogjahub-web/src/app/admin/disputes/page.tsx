"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { disputeMocks } from "@/src/features/admin/mocks/disputeMocks";
import type { Dispute } from "@/src/features/admin/types";

const statusStyles: Record<string, string> = {
  open: "bg-[#FFF8E1] text-[#8A6D00]",
  resolved: "bg-[#E6F4EA] text-[#1E7B34]",
};

const roleStyles: Record<string, string> = {
  customer: "bg-[#EFF4FF] text-[#1E3A8A]",
  tenant: "bg-[#F3E8FF] text-[#6B21A8]",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulasi delay kecil supaya state loading terlihat natural.
    // TODO: ganti dengan panggilan API sungguhan ke adminApi.getDisputes() begitu backend siap.
    const timer = setTimeout(() => {
      setDisputes(disputeMocks);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-[#121C2A]">Sengketa</h1>

      <p className="text-sm italic text-[#5A4136]/60">Data contoh — belum terhubung ke backend.</p>

      <div className="overflow-x-auto rounded-2xl border border-[#D3E2ED] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#E6EEFF] text-[#5A4136]">
            <tr>
              <th className="p-4 font-medium">Subjek</th>
              <th className="p-4 font-medium">Pembuka</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Tanggal</th>
              <th className="p-4 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EEFF]">
            {disputes.map((dispute) => (
              <tr key={dispute.uuid}>
                <td className="p-4 font-medium text-[#121C2A]">{dispute.subject}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[#5A4136]">{dispute.opener_name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${roleStyles[dispute.opener_role] ?? "bg-[#F8F9FF] text-[#121C2A]"}`}>
                      {dispute.opener_role}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[dispute.status] ?? "bg-[#F8F9FF] text-[#121C2A]"}`}>
                    {dispute.status}
                  </span>
                </td>
                <td className="p-4 text-[#5A4136]">{formatDate(dispute.created_at)}</td>
                <td className="p-4">
                  <Link
                    href={`/admin/disputes/${dispute.uuid}`}
                    className="inline-flex rounded-full bg-[#FF6B00] px-3 py-1.5 text-xs font-semibold text-[#121C2A] hover:bg-[#E85F00]"
                  >
                    Buka
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && disputes.length === 0 ? <p className="p-6 text-center text-sm text-[#5A4136]">Tidak ada sengketa.</p> : null}
        {isLoading ? <p className="p-6 text-center text-sm text-[#5A4136]">Memuat...</p> : null}
      </div>
    </div>
  );
}