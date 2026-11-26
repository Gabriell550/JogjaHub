"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ROUTES } from "@/src/constants/routes";
import { useApiAction, useApiQuery } from "@/src/hooks/useApiRequest";
import { apiPatch, apiPost, type Resource } from "@/src/lib/api";
import { ActionButton, Field, fieldClass, linkClass, LoadingData, PageHeading, panelClass, RequestError } from "@/src/components/shared/OperationsUi";
import { BookingSummary, CompletionIssue } from "@/src/features/booking/BookingSummary";
import { bookingCode, hasOpenIssue } from "@/src/features/booking/bookingDisplay";
import type { BookingResource } from "@/src/types/booking";

export function BookingDetail({ role }: { role: "customer" | "tenant" }) {
  const { uuid } = useParams<{ uuid: string }>();
  return <Detail key={uuid} role={role} uuid={uuid} />;
}

function Detail({ role, uuid }: { role: "customer" | "tenant"; uuid: string }) {
  const endpoint = `/${role}/bookings/${encodeURIComponent(uuid)}`;
  const query = useApiQuery<Resource<BookingResource>>(endpoint);
  const action = useApiAction();
  const [updated, setUpdated] = useState<BookingResource>();
  const [reason, setReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const base = query.data?.data;
  const booking = base && updated ? { ...base, ...updated } : base;
  const tenant = role === "tenant";
  const backLink = tenant ? ROUTES.vendorOrders
    : booking?.status === "completed" || booking?.status === "cancelled" ? ROUTES.dashboardHistory : ROUTES.dashboardOrders;

  function perform(operation: string, payload?: Record<string, string>) {
    void action.run(async () => {
      if (operation === "status") {
        await apiPatch(`${endpoint}/status`, payload);
        setUpdated(undefined);
        query.reload();
        return;
      }
      const response = await apiPost<Resource<BookingResource>>(`${endpoint}/${operation}`, payload);
      setUpdated(response.data);
      setReporting(false);
      setReason("");
    });
  }

  return (
    <section className={`space-y-5 ${tenant ? "" : "mx-auto max-w-4xl px-4 py-8 sm:px-6"}`}>
      <Link href={backLink} className={linkClass}>Kembali ke {backLink === ROUTES.dashboardHistory ? "riwayat" : "pesanan"}</Link>
      <PageHeading title={booking ? bookingCode(booking.id) : "Detail pesanan"}>
        <ActionButton disabled={query.loading || action.busy} onClick={() => { setUpdated(undefined); query.reload(); }}>Muat ulang</ActionButton>
      </PageHeading>
      {query.loading && <LoadingData />}
      <RequestError message={query.error} retry={query.reload} />
      {booking && (
        <>
          <div className={panelClass}><BookingSummary booking={booking} /></div>
          <CompletionIssue booking={booking} />
          {tenant && booking.payment?.payout_waiting_for_destination && (
            <div className={panelClass}>
              <p>Penerimaan sudah tercatat. Simpan tujuan pencairan untuk melanjutkan proses.</p>
              <Link href={`${ROUTES.vendorProfile}#tujuan-pencairan`} className={linkClass}>Atur tujuan pencairan</Link>
            </div>
          )}
          <RequestError message={action.error} />
          {tenant && booking.status === "pending" && (
            <div className="flex flex-wrap gap-2">
              <ActionButton disabled={action.busy} onClick={() => perform("status", { status: "confirmed" })}>Terima pesanan</ActionButton>
              <ActionButton disabled={action.busy} onClick={() => perform("status", { status: "cancelled" })}>Tolak pesanan</ActionButton>
            </div>
          )}
          {tenant && booking.can_mark_fulfilled === true && (
            <ActionButton disabled={action.busy} onClick={() => perform("mark-fulfilled")}>{booking.demo_pickup ? "Siap diambil" : "Selesai dikerjakan"}</ActionButton>
          )}
          {!tenant && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {booking.status === "awaiting_completion_confirmation" && !(booking.payment?.fund_status && hasOpenIssue(booking)) && (
                  <ActionButton disabled={action.busy} onClick={() => perform("confirm-completion")}>Pesanan diterima</ActionButton>
                )}
                {booking.payment?.fund_status && !booking.issue_reported_at &&
                  (booking.status === "confirmed" || booking.status === "awaiting_completion_confirmation") && (
                    <ActionButton disabled={action.busy} aria-expanded={reporting} onClick={() => setReporting(!reporting)}>Laporkan kendala</ActionButton>
                  )}
              </div>
              {reporting && (
                <form className={`${panelClass} space-y-3`} onSubmit={(event) => {
                  event.preventDefault();
                  if (reason.trim()) perform("completion-issue", { reason: reason.trim() });
                }}>
                  <Field label="Alasan kendala"><textarea className={fieldClass} required maxLength={1000} rows={4} value={reason} onChange={(event) => setReason(event.target.value)} /></Field>
                  <ActionButton type="submit" disabled={action.busy || !reason.trim()}>Kirim laporan</ActionButton>
                </form>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
