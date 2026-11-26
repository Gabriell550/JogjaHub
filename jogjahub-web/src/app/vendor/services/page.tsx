"use client";

import Image from "next/image";
import { useState } from "react";
import { useApiAction, useApiQuery } from "@/src/hooks/useApiRequest";
import { apiDelete, apiPatch, type Page } from "@/src/lib/api";
import { ActionButton, LoadingData, PageHeading, Pagination, panelClass, RequestError } from "@/src/components/shared/OperationsUi";
import { ServiceForm } from "@/src/features/vendor/ServiceForm";
import { rupiah } from "@/src/features/booking/bookingDisplay";
import type { Service } from "@/src/types/service";

export default function VendorServices() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const query = useApiQuery<Page<Service>>(`/tenant/services?page=${page}`);
  const { busy, error, run, setError } = useApiAction();
  const result = query.data;

  function remove(service: Service) {
    if (!window.confirm(`Hapus layanan “${service.name}”?`)) return;
    void run(async () => {
      await apiDelete(`/tenant/services/${service.id}`);
      if (page > 1 && result?.data.length === 1) setPage(page - 1);
      query.reload();
    });
  }

  function changeStatus(service: Service) {
    void run(async () => {
      await apiPatch(`/tenant/services/${service.id}`, { is_active: service.is_active === false });
      query.reload();
    });
  }

  return (
    <section className="space-y-5">
      <PageHeading title="Layanan">
        {editing === null && <ActionButton disabled={busy} onClick={() => { setError(""); setEditing("new"); }}>Tambah layanan</ActionButton>}
      </PageHeading>
      {editing !== null ? (
        <ServiceForm serviceId={editing === "new" ? null : editing} onCancel={() => setEditing(null)} onSaved={() => {
          if (editing === "new") setPage(1);
          setEditing(null);
          query.reload();
        }} />
      ) : (
        <>
          {query.loading && <LoadingData />}
          <RequestError message={query.error} retry={query.reload} />
          <RequestError message={error} />
          {result && (
            <>
              {!result.data.length ? <p className={panelClass}>Belum ada layanan.</p> : (
                <ul className="grid gap-3 xl:grid-cols-2">
                  {result.data.map((service) => {
                    const photo = service.photos?.[0];
                    const active = service.is_active !== false;
                    return (
                      <li key={service.id} className={`${panelClass} space-y-4`}>
                        <div className="flex items-start gap-3">
                          {photo && <Image src={photo.full_url} alt="" width={72} height={72} unoptimized className="size-16 shrink-0 rounded-lg object-cover" />}
                          <div className="min-w-0 break-words">
                            <h2 className="font-display text-lg font-semibold">{service.name}</h2>
                            <p className="text-sm text-[#4B596B]">{service.subcategory?.name}</p>
                            <p className="mt-1 text-sm font-semibold">{rupiah(service.price)} · {service.price_type === "per_night" ? "Per malam" : "Per sesi"}</p>
                            <p className="mt-1 text-sm">{active ? "Aktif" : "Nonaktif"}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <ActionButton disabled={busy} onClick={() => { setError(""); setEditing(service.id); }}>Edit</ActionButton>
                          <ActionButton disabled={busy} onClick={() => changeStatus(service)}>{active ? "Nonaktifkan" : "Aktifkan"}</ActionButton>
                          <ActionButton disabled={busy} onClick={() => remove(service)}>Hapus</ActionButton>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Pagination current={result.meta.current_page} last={result.meta.last_page} onChange={setPage} />
            </>
          )}
        </>
      )}
    </section>
  );
}
