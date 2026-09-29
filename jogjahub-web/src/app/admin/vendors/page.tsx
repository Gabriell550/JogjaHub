"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/src/features/admin/services/adminApi";
import type { PendingTenant } from "@/src/features/admin/types";

export default function AdminVendorsPage() {
  const [tenants, setTenants] = useState<PendingTenant[]>([]);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadTenants() {
      try {
        const res = await adminApi.getPendingTenants();
        if (!active) return;
        setTenants(adminApi.unwrapList(res.data));
      } catch (err) {
        console.log("Gagal memuat vendor pending:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadTenants();
    return () => {
      active = false;
    };
  }, []);

  async function handleApprove(id: number) {
    try {
      await adminApi.approveTenant(id);
      setTenants((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyetujui vendor.");
    }
  }

  async function handleConfirmReject(id: number) {
    if (!rejectionReason.trim()) return;
    try {
      await adminApi.rejectTenant(id, rejectionReason.trim());
      setTenants((prev) => prev.filter((t) => t.id !== id));
      setRejectingId(null);
      setRejectionReason("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menolak vendor.");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-[#121C2A]">Verifikasi Vendor</h1>
      <div className="overflow-x-auto rounded-2xl border border-[#D3E2ED] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#E6EEFF] text-[#5A4136]">
            <tr>
              <th className="p-4 font-medium">Nama Bisnis</th>
              <th className="p-4 font-medium">Pemilik</th>
              <th className="p-4 font-medium">Kategori</th>
              <th className="p-4 font-medium">Dokumen</th>
              <th className="p-4 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EEFF]">
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td className="p-4 font-medium text-[#121C2A]">{tenant.business_name}</td>
                <td className="p-4 text-[#5A4136]">{tenant.user.name}<br /><span className="text-xs">{tenant.user.email}</span></td>
                <td className="p-4 text-[#5A4136]">{tenant.categories.map((c) => c.name).join(", ") || "-"}</td>
                <td className="p-4">
                  <div className="flex flex-col gap-1 text-xs">
                    {tenant.ktp_url ? <a href={tenant.ktp_url} target="_blank" rel="noreferrer" className="text-[#A04100] underline">Lihat KTP</a> : <span className="text-[#5A4136]/50">KTP belum ada</span>}
                    {tenant.nib_url ? <a href={tenant.nib_url} target="_blank" rel="noreferrer" className="text-[#A04100] underline">Lihat NIB</a> : null}
                  </div>
                </td>
                <td className="p-4">
                  {rejectingId === tenant.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Alasan penolakan (wajib diisi)" className="min-h-16 rounded-md border border-[#D3E2ED] p-2 text-xs" />
                      <div className="flex gap-2">
                        <button onClick={() => handleConfirmReject(tenant.id)} disabled={!rejectionReason.trim()} className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Kirim Penolakan</button>
                        <button onClick={() => { setRejectingId(null); setRejectionReason(""); }} className="rounded-full border border-[#D3E2ED] px-3 py-1.5 text-xs font-semibold text-[#121C2A]">Batal</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(tenant.id)} className="rounded-full bg-[#FF6B00] px-3 py-1.5 text-xs font-semibold text-[#121C2A] hover:bg-[#E85F00]">Setujui</button>
                      <button onClick={() => setRejectingId(tenant.id)} className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">Tolak</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && tenants.length === 0 ? <p className="p-6 text-center text-sm text-[#5A4136]">Tidak ada vendor yang menunggu verifikasi.</p> : null}
        {isLoading ? <p className="p-6 text-center text-sm text-[#5A4136]">Memuat...</p> : null}
      </div>
    </div>
  );
}
