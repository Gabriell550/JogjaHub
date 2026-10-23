"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/src/features/admin/services/adminApi";
import type { PendingTenant } from "@/src/features/admin/types";

const PRESET_REASONS = [
  "Foto KTP buram / tidak terbaca",
  "Dokumen NIB / Legalitas tidak sesuai nama pemilik",
  "Titik koordinat lokasi berada di luar Daerah Istimewa Yogyakarta",
  "Kategori layanan tidak sesuai dengan portofolio yang dilampirkan",
  "Nomor kontak WhatsApp tidak aktif atau tidak dapat dihubungi",
];

export default function AdminVendorsPage() {
  const [tenants, setTenants] = useState<PendingTenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<PendingTenant | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  async function handleApprove(uuid: string) {
    try {
      await adminApi.approveTenant(uuid);
      setTenants((prev) => prev.filter((t) => t.uuid !== uuid));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyetujui vendor.");
    }
  }

  function openRejectModal(tenant: PendingTenant) {
    setSelectedTenant(tenant);
    setRejectionReason("");
    setIsRejectModalOpen(true);
  }

  function closeRejectModal() {
    setIsRejectModalOpen(false);
    setSelectedTenant(null);
    setRejectionReason("");
  }

  async function handleConfirmReject() {
    if (!selectedTenant || !rejectionReason.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await adminApi.rejectTenant(selectedTenant.uuid, rejectionReason.trim());
      setTenants((prev) => prev.filter((t) => t.uuid !== selectedTenant.uuid));
      closeRejectModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menolak vendor.");
    } finally {
      setIsSubmitting(false);
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
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(tenant.uuid)} className="rounded-full bg-[#FF6B00] px-3 py-1.5 text-xs font-semibold text-[#121C2A] hover:bg-[#E85F00]">Setujui</button>
                    <button onClick={() => openRejectModal(tenant)} className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">Tolak</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && tenants.length === 0 ? <p className="p-6 text-center text-sm text-[#5A4136]">Tidak ada vendor yang menunggu verifikasi.</p> : null}
        {isLoading ? <p className="p-6 text-center text-sm text-[#5A4136]">Memuat...</p> : null}
      </div>

      {/* Modal Dialog Penolakan */}
      {isRejectModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-[#121C2A]">
              Tolak Pendaftaran: {selectedTenant.business_name}
            </h2>
            <p className="mt-1 text-xs text-[#5A4136]">
              Berikan alasan yang jelas mengapa pendaftaran ini ditolak. Catatan ini akan dibaca langsung oleh vendor di aplikasi mobile untuk perbaikan data.
            </p>

            <div className="mt-4">
              <label className="text-xs font-medium text-[#121C2A]">Pilih Alasan Cepat (Opsional):</label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PRESET_REASONS.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      if (!rejectionReason.trim()) {
                        setRejectionReason(preset);
                      } else if (!rejectionReason.includes(preset)) {
                        setRejectionReason((prev) => `${prev.trim()}\n- ${preset}`);
                      }
                    }}
                    className="rounded-full border border-[#D3E2ED] bg-[#F8FAFC] px-2.5 py-1 text-[11px] text-[#5A4136] hover:border-[#FF6B00] hover:text-[#FF6B00]"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-[#5A4136]">
                <label className="font-medium text-[#121C2A]">Alasan / Catatan Penolakan (Wajib):</label>
                <span>{rejectionReason.length}/500</span>
              </div>
              <textarea
                value={rejectionReason}
                maxLength={500}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Foto KTP buram dan terpotong. Mohon upload ulang foto KTP yang jelas..."
                className="mt-1.5 w-full min-h-[100px] rounded-lg border border-[#D3E2ED] p-3 text-xs focus:border-[#FF6B00] focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeRejectModal}
                disabled={isSubmitting}
                className="rounded-full border border-[#D3E2ED] px-4 py-2 text-xs font-semibold text-[#121C2A] hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim() || isSubmitting}
                className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Penolakan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
