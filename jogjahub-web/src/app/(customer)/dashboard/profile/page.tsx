"use client";

import { useAuth } from "@/src/hooks/useAuth";

export default function CustomerProfilePage() {
  const { session } = useAuth();

  if (!session || session.user.role !== "customer") return null;

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#A04100]">Akun customer</p>
        <h1 className="font-display mt-2 text-3xl font-bold text-[#121C2A]">Profil</h1>
        <p className="mt-2 text-sm text-[#4B596B]">Informasi akun dari sesi login kamu.</p>
      </div>
      <dl className="max-w-2xl divide-y divide-[#E6EEFF] rounded-2xl border border-[#DFE6F3] bg-white px-5 shadow-sm sm:px-6">
        <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
          <dt className="text-sm font-medium text-[#5A6472]">Nama</dt>
          <dd className="text-sm font-semibold text-[#121C2A]">{session.user.name}</dd>
        </div>
        <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
          <dt className="text-sm font-medium text-[#5A6472]">Email</dt>
          <dd className="break-all text-sm font-semibold text-[#121C2A]">{session.user.email}</dd>
        </div>
        <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
          <dt className="text-sm font-medium text-[#5A6472]">Nomor telepon</dt>
          <dd className="text-sm font-semibold text-[#121C2A]">{session.user.phone || "Belum diisi"}</dd>
        </div>
      </dl>
    </section>
  );
}
