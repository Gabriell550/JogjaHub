"use client";

import Link from "next/link";
import { useState } from "react";
import { ROUTES } from "@/src/constants/routes";
import { useApiQuery } from "@/src/hooks/useApiRequest";
import { ActionButton, linkClass, LoadingData, PageHeading, Pagination, panelClass, RequestError } from "@/src/components/shared/OperationsUi";
import { bookingCode, fundStatusLabels, paymentLabel, rupiah } from "@/src/features/booking/bookingDisplay";
import type { Page } from "@/src/lib/api";
import type { BookingResource } from "@/src/types/booking";

export default function VendorEarnings() {
  const [page, setPage] = useState(1);
  const query = useApiQuery<Page<BookingResource>>(`/tenant/demo-earnings?page=${page}`);
  const result = query.data;
  const destination = `${ROUTES.vendorProfile}#tujuan-pencairan`;

  return (
    <section className="space-y-5">
      <PageHeading title="Pendapatan"><ActionButton disabled={query.loading} onClick={query.reload}>Muat ulang</ActionButton></PageHeading>
      <p className="text-sm text-[#5A4136]">Mode demo · Pembayaran dan pencairan disimulasikan</p>
      <Link href={destination} className={linkClass}>Atur tujuan pencairan</Link>
      {query.loading && <LoadingData />}
      <RequestError message={query.error} retry={query.reload} />
      {result && (
        <>
          {!result.data.length ? <p className={panelClass}>Belum ada pendapatan demo.</p> : (
            <ul className="space-y-3">
              {result.data.map((booking) => (
                <li className={`${panelClass} grid gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center`} key={booking.uuid}>
                  <div className="min-w-0">
                    <Link className={linkClass} href={`${ROUTES.vendorOrders}/${booking.uuid}`}>{bookingCode(booking.id)}</Link>
                    {booking.service?.name && <p className="break-words text-sm">{booking.service.name}</p>}
                  </div>
                  <p className="font-bold">{rupiah(booking.total_amount)}</p>
                  <div className="text-sm sm:text-right">
                    <p className="font-semibold">{booking.payment?.fund_status ? fundStatusLabels[booking.payment.fund_status] : paymentLabel(booking.payment?.status)}</p>
                    {booking.payment?.payout_destination && <p className="mt-1 break-words">Tujuan · {booking.payment.payout_destination}</p>}
                  </div>
                  {booking.payment?.payout_waiting_for_destination && (
                    <p className="mt-2 text-sm sm:col-span-3">Penerimaan sudah tercatat.{" "}<Link href={destination} className={linkClass}>Simpan tujuan untuk melanjutkan pencairan</Link>.</p>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Pagination current={result.meta.current_page} last={result.meta.last_page} onChange={setPage} />
        </>
      )}
    </section>
  );
}
