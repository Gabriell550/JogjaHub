"use client";

import { useState } from "react";
import { useApiQuery } from "@/src/hooks/useApiRequest";
import { ActionButton, LoadingData, PageHeading, Pagination, RequestError } from "@/src/components/shared/OperationsUi";
import { VendorBookingList } from "@/src/features/vendor/VendorBookingList";
import type { Page } from "@/src/lib/api";
import type { BookingResource } from "@/src/types/booking";

export default function VendorOrders() {
  const [page, setPage] = useState(1);
  const query = useApiQuery<Page<BookingResource>>(`/tenant/bookings?page=${page}`);

  return (
    <section className="space-y-5">
      <PageHeading title="Pesanan"><ActionButton disabled={query.loading} onClick={query.reload}>Muat ulang</ActionButton></PageHeading>
      {query.loading && <LoadingData />}
      <RequestError message={query.error} retry={query.reload} />
      {query.data && (
        <>
          <VendorBookingList bookings={query.data.data} />
          <Pagination current={query.data.meta.current_page} last={query.data.meta.last_page} onChange={setPage} />
        </>
      )}
    </section>
  );
}
