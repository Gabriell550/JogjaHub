"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/src/features/admin/services/adminApi";
import type { TenantDocumentType } from "@/src/features/admin/services/adminApi";
import type { PendingTenant } from "@/src/features/admin/types";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function DocumentPreview({
  tenantUuid,
  type,
  title,
  hasDocument,
}: {
  tenantUuid: string;
  type: TenantDocumentType;
  title: string;
  hasDocument: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    async function loadDocument() {
      if (!hasDocument) {
        setIsLoading(false);
        setError("");
        setUrl(null);
        return;
      }
      setIsLoading(true);
      setError("");
      setUrl(null);

      try {
        const document = await adminApi.getTenantDocument(tenantUuid, type);
        if (!active) return;
        objectUrl = URL.createObjectURL(document);
        setContentType(document.type);
        setUrl(objectUrl);
      } catch (requestError) {
        if (active) setError(errorMessage(requestError, "Dokumen gagal dimuat."));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadDocument();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [tenantUuid, type, hasDocument]);

  const isImage = contentType.startsWith("image/");
  const isPdf = contentType === "application/pdf";

  return (
    <section className="rounded-xl border border-[#E3E8F0] bg-white p-4 sm:p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
        <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-lg bg-[#FFF0E5] text-[#A04100]">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6M8 13h8M8 17h8" />
          </svg>
        </span>
        {title}
      </h3>

      <div className="grid min-h-48 place-items-center overflow-hidden rounded-lg border border-[#E3E8F0] bg-[#F4F6FA] p-3 sm:min-h-64">
        {isLoading ? (
          <p role="status" className="text-sm text-[#5A6472]">Memuat dokumen…</p>
        ) : error ? (
          <p role="alert" className="max-w-sm text-center text-sm text-[#BA1A1A]">{error}</p>
        ) : url && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={title} className="max-h-[30rem] w-full object-contain" />
        ) : url && isPdf ? (
          <iframe title={title} src={url} className="h-72 w-full rounded-md sm:h-96" />
        ) : url ? (
          <p className="text-center text-sm text-[#5A6472]">
            Pratinjau tidak tersedia untuk format ini.{" "}
            <a href={url} download className="font-medium text-[#A04100] underline underline-offset-2">
              Unduh {title}
            </a>
          </p>
        ) : (
          <p className="text-sm text-[#5A6472]">{hasDocument ? "Dokumen tidak tersedia." : "Dokumen belum diunggah."}</p>
        )}
      </div>

      {url && (isImage || isPdf) ? (
        <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-10 items-center text-sm font-medium text-[#A04100] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">
          Buka dokumen di tab baru
        </a>
      ) : null}
    </section>
  );
}

export default function AdminVendorsPage() {
  const [tenants, setTenants] = useState<PendingTenant[]>([]);
  const [selectedUuid, setSelectedUuid] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const selectedTenant = tenants.find((tenant) => tenant.uuid === selectedUuid) ?? null;

  useEffect(() => {
    let active = true;

    async function loadTenants() {
      setIsLoading(true);
      setError("");
      try {
        const response = await adminApi.getPendingTenants();
        if (!active) return;
        const pendingTenants = adminApi.unwrapList(response.data);
        setTenants(pendingTenants);
        setSelectedUuid((currentUuid) =>
          pendingTenants.some((tenant) => tenant.uuid === currentUuid)
            ? currentUuid
            : pendingTenants[0]?.uuid ?? "",
        );
      } catch (requestError) {
        if (active) setError(errorMessage(requestError, "Pengajuan verifikasi gagal dimuat."));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadTenants();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const refreshTenants = useCallback(() => {
    setFeedback("");
    setReloadKey((current) => current + 1);
  }, []);

  function selectTenant(uuid: string) {
    setSelectedUuid(uuid);
    setRejectionReason("");
    setError("");
    setFeedback("");
  }

  function removeProcessedTenant(uuid: string) {
    const currentIndex = tenants.findIndex((tenant) => tenant.uuid === uuid);
    const remainingTenants = tenants.filter((tenant) => tenant.uuid !== uuid);
    setTenants(remainingTenants);
    setSelectedUuid(remainingTenants[Math.min(currentIndex, remainingTenants.length - 1)]?.uuid ?? "");
    setRejectionReason("");
  }

  async function handleApprove() {
    if (!selectedTenant || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    setFeedback("");
    try {
      const response = await adminApi.approveTenant(selectedTenant.uuid);
      removeProcessedTenant(selectedTenant.uuid);
      setFeedback(response.message || "Pengajuan tenant berhasil disetujui.");
    } catch (requestError) {
      setError(errorMessage(requestError, "Pengajuan tenant gagal disetujui."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    const reason = rejectionReason.trim();
    if (!selectedTenant || !reason || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    setFeedback("");
    try {
      const response = await adminApi.rejectTenant(selectedTenant.uuid, reason);
      removeProcessedTenant(selectedTenant.uuid);
      setFeedback(response.message || "Pengajuan tenant berhasil ditolak.");
    } catch (requestError) {
      setError(errorMessage(requestError, "Pengajuan tenant gagal ditolak."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-[#E3E8F0] pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium text-[#657184]">Admin <span aria-hidden="true">/</span> Verification</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#172033] sm:text-[28px]">
            Verification Detail
          </h1>
          <p className="mt-1 text-sm text-[#5A6472]">Review dokumen dan informasi pendaftaran tenant.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="pending-tenant" className="text-sm font-medium text-[#384458]">Pengajuan</label>
          <select
            id="pending-tenant"
            value={selectedTenant?.uuid ?? ""}
            onChange={(event) => selectTenant(event.target.value)}
            disabled={isLoading || tenants.length === 0 || isSubmitting}
            className="min-h-11 min-w-52 max-w-full rounded-lg border border-[#D8DFE9] bg-white px-3 text-sm text-[#172033] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] disabled:cursor-not-allowed disabled:bg-[#F4F6FA]"
          >
            {tenants.length === 0 ? <option value="">Tidak ada pengajuan</option> : null}
            {tenants.map((tenant) => (
              <option key={tenant.uuid} value={tenant.uuid}>
                {tenant.business_name} — {tenant.user.name}
              </option>
            ))}
          </select>
          <span className="rounded-full bg-[#FFF0E5] px-3 py-1.5 text-xs font-semibold text-[#A04100]">
            {isLoading ? "Memuat…" : `${tenants.length} pending`}
          </span>
        </div>
      </header>

      {error ? (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-[#F2B8B5] bg-[#FFF5F4] p-4 text-sm text-[#8F1712] sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>
          {!selectedTenant ? (
            <button type="button" onClick={refreshTenants} className="min-h-10 rounded-lg border border-[#D99792] px-4 font-semibold hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">
              Coba lagi
            </button>
          ) : null}
        </div>
      ) : null}
      {feedback ? (
        <p role="status" className="rounded-xl border border-[#A7D8B5] bg-[#EFFAF2] px-4 py-3 text-sm font-medium text-[#176B34]">
          {feedback}
        </p>
      ) : null}

      {isLoading ? (
        <div role="status" className="grid min-h-72 place-items-center rounded-2xl border border-[#E3E8F0] bg-white text-sm text-[#5A6472]">
          Memuat pengajuan dan dokumen verifikasi…
        </div>
      ) : !selectedTenant ? (
        <section className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-[#CBD4E1] bg-white px-6 text-center">
          <div>
            <div aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#EFFAF2] text-[#176B34]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 4 4L19 6" />
              </svg>
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold text-[#172033]">Tidak ada pengajuan pending</h2>
            <p className="mt-1 max-w-md text-sm text-[#5A6472]">Pengajuan baru akan tampil di sini setelah tenant mengirimkan pendaftarannya.</p>
          </div>
        </section>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
          <section aria-labelledby="document-review-title" className="space-y-4">
            <div>
              <h2 id="document-review-title" className="font-display text-lg font-semibold text-[#172033]">Document Review</h2>
              <p className="mt-1 text-sm text-[#5A6472]">Verifikasi keaslian dokumen legal dan portofolio yang dikirimkan.</p>
            </div>
            <DocumentPreview key={`${selectedTenant.uuid}-ktp`} tenantUuid={selectedTenant.uuid} type="ktp" title="Identity Card (KTP)" hasDocument={Boolean(selectedTenant.ktp_url)} />
            <DocumentPreview key={`${selectedTenant.uuid}-nib`} tenantUuid={selectedTenant.uuid} type="nib" title="Business License (NIB)" hasDocument={Boolean(selectedTenant.nib_url)} />
            {selectedTenant.portfolio_url ? (
              <DocumentPreview key={`${selectedTenant.uuid}-portfolio`} tenantUuid={selectedTenant.uuid} type="portfolio" title="Portfolio" hasDocument />
            ) : null}
          </section>

          <aside aria-labelledby="action-center-title" className="space-y-4 xl:sticky xl:top-6">
            <h2 id="action-center-title" className="font-display text-lg font-semibold text-[#172033]">Action Center</h2>

            <section className="rounded-xl border border-[#D8DFE9] bg-white p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E4EEFF] text-sm font-semibold text-[#234D8F]">
                  {initials(selectedTenant.user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#172033]">{selectedTenant.user.name}</p>
                  <p className="text-sm text-[#5A6472]">{selectedTenant.business_name}</p>
                  <p className="mt-1 break-all text-xs text-[#657184]">{selectedTenant.user.email}</p>
                </div>
                <span className="rounded-full bg-[#FFF3E6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#9A4A00]">
                  Pending
                </span>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-[#E8ECF2] pt-4 text-xs">
                <div>
                  <dt className="text-[#657184]">Kategori</dt>
                  <dd className="mt-1 font-medium text-[#263248]">{selectedTenant.categories.map((category) => category.name).join(", ") || "-"}</dd>
                </div>
                <div>
                  <dt className="text-[#657184]">Kontak</dt>
                  <dd className="mt-1 font-medium text-[#263248]">{selectedTenant.user.phone || "-"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[#657184]">Lokasi</dt>
                  <dd className="mt-1 font-medium text-[#263248]">{selectedTenant.address?.street || "-"}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-[#D8DFE9] bg-white p-4 sm:p-5">
              <label htmlFor="rejection-reason" className="font-display text-sm font-semibold text-[#172033]">
                Review Notes &amp; Rejection Reason
              </label>
              <p className="mt-1 text-xs leading-5 text-[#657184]">
                Isi catatan jika pengajuan ditolak. Alasan ini akan diteruskan kepada tenant.
              </p>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                maxLength={500}
                disabled={isSubmitting}
                placeholder="Jelaskan alasan penolakan atau berikan umpan balik untuk tenant…"
                className="mt-3 min-h-36 w-full resize-y rounded-lg border border-[#D8DFE9] bg-white p-3 text-sm leading-5 text-[#172033] placeholder:text-[#8A94A4] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#A04100] disabled:bg-[#F4F6FA]"
              />
              <p className="mt-1 text-right text-xs text-[#657184]">{rejectionReason.length}/500</p>
            </section>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleReject}
                disabled={isSubmitting || !rejectionReason.trim()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#C62828] px-3 text-sm font-semibold text-white transition hover:bg-[#A91F1F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Memproses…" : "Reject Application"}
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#159447] px-3 text-sm font-semibold text-white transition hover:bg-[#117A3A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Memproses…" : "Approve Vendor"}
              </button>
            </div>
            <p className="text-center text-xs leading-5 text-[#657184]">
              Persetujuan akan memindahkan tenant ke status approved. Penolakan memerlukan alasan.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
