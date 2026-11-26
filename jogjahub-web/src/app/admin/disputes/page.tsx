"use client";

import { useState } from "react";
import { apiPost, type Page } from "@/src/lib/api";
import { useApiAction, useApiQuery } from "@/src/hooks/useApiRequest";
import { ActionButton, Field, fieldClass, LoadingData, PageHeading, Pagination, panelClass, RequestError } from "@/src/components/shared/OperationsUi";
import { BookingSummary, CompletionIssue } from "@/src/features/booking/BookingSummary";
import { bookingCode, hasOpenIssue } from "@/src/features/booking/bookingDisplay";
import type { BookingResource } from "@/src/types/booking";

function EscrowCase({ booking, onSaved }: { booking: BookingResource; onSaved: () => void }) {
  const [resolution, setResolution] = useState("");
  const { busy, error, run } = useApiAction();
  const openIssue = hasOpenIssue(booking);
  const payment = booking.payment;
  const endpoint = `/admin/bookings/${booking.uuid}`;

  function submit(operation: string, payload?: { resolution: string }) {
    void run(async () => {
      await apiPost(`${endpoint}/${operation}`, payload);
      onSaved();
    });
  }

  return (
    <li className={`${panelClass} space-y-4`}>
      <div>
        <h2 className="font-display text-xl font-semibold">{bookingCode(booking.id)}</h2>
        {booking.service?.tenant?.business_name && <p className="mt-1 text-sm text-[#4B596B]">{booking.service.tenant.business_name}</p>}
      </div>
      <BookingSummary booking={booking} />
      <CompletionIssue booking={booking} />
      {payment?.payout_waiting_for_destination && <p className="text-sm">Tenant perlu menyimpan tujuan pencairan di Manajemen Akun.</p>}
      <RequestError message={error} />
      {openIssue ? (
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault();
          if (resolution.trim()) submit("resolve-completion-issue", { resolution: resolution.trim() });
        }}>
          <Field label="Catatan penyelesaian"><textarea className={fieldClass} rows={3} required maxLength={1000} value={resolution} onChange={(event) => setResolution(event.target.value)} /></Field>
          <ActionButton type="submit" disabled={busy || !resolution.trim()}>Selesaikan kendala</ActionButton>
        </form>
      ) : payment?.fund_status === "failed" && (
        <ActionButton disabled={busy} onClick={() => submit("retry-demo-payout")}>Coba lagi pencairan</ActionButton>
      )}
    </li>
  );
}

export default function AdminDisputesPage() {
  const [page, setPage] = useState(1);
  const query = useApiQuery<Page<BookingResource>>(`/admin/demo-escrow-cases?page=${page}`);
  const result = query.data;

  function reloadAfterAction() {
    if (page > 1 && result?.data.length === 1) setPage(page - 1);
    query.reload();
  }

  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <PageHeading title="Monitoring Escrow">
        <ActionButton disabled={query.loading} onClick={query.reload}>Muat ulang</ActionButton>
      </PageHeading>
      <p className="text-sm text-[#5A4136]">Mode demo · Pembayaran dan pencairan disimulasikan</p>
      {query.loading && <LoadingData />}
      <RequestError message={query.error} retry={query.reload} />
      {result && (
        <>
          {result.data.length ? <ul className="space-y-4">{result.data.map((booking) => <EscrowCase key={booking.uuid} booking={booking} onSaved={reloadAfterAction} />)}</ul>
            : <p className={panelClass}>Belum ada kasus escrow yang perlu ditangani.</p>}
          <Pagination current={result.meta.current_page} last={result.meta.last_page} onChange={setPage} />
        </>
      )}
    </section>
  );
}
