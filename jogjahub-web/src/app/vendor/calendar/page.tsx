"use client";

import { useState } from "react";
import { useApiAction, useApiQuery } from "@/src/hooks/useApiRequest";
import { apiDelete, apiPost, type Page, type Resource } from "@/src/lib/api";
import { ActionButton, Field, fieldClass, LoadingData, PageHeading, Pagination, panelClass, RequestError } from "@/src/components/shared/OperationsUi";
import { orderDate } from "@/src/features/booking/bookingDisplay";
import type { Service, TimeSlot } from "@/src/types/service";

function ServiceSlots({ serviceId }: { serviceId: number }) {
  const slots = useApiQuery<Resource<TimeSlot[]>>(`/tenant/services/${serviceId}/time-slots`);
  const { busy, error, run } = useApiAction();
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta" }).format(new Date());

  return (
    <>
      <form className={`${panelClass} space-y-4`} onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const fields = new FormData(form);
        void run(async () => {
          await apiPost("/tenant/time-slots", {
            service_id: serviceId,
            slot_date: fields.get("slot_date"),
            start_time: fields.get("start_time"),
            end_time: fields.get("end_time"),
            quota: Number(fields.get("quota")),
          });
          form.reset();
          slots.reload();
        });
      }}>
        <h2 className="font-display text-xl font-semibold">Tambah slot</h2>
        <fieldset disabled={busy} className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Tanggal"><input className={fieldClass} type="date" name="slot_date" min={today} required /></Field>
          <Field label="Mulai (WIB)"><input className={fieldClass} type="time" name="start_time" required /></Field>
          <Field label="Selesai (WIB)"><input className={fieldClass} type="time" name="end_time" required /></Field>
          <Field label="Kuota"><input className={fieldClass} type="number" name="quota" min={1} step={1} defaultValue={1} required /></Field>
        </fieldset>
        <ActionButton type="submit" disabled={busy}>Tambah slot</ActionButton>
      </form>
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">Jadwal layanan</h2>
          <ActionButton disabled={slots.loading || busy} onClick={slots.reload}>Muat ulang</ActionButton>
        </div>
        <RequestError message={error} />
        <RequestError message={slots.error} retry={slots.reload} />
        {slots.loading && <LoadingData />}
        {slots.data && (slots.data.data.length ? (
          <ul className="space-y-2">
            {slots.data.data.map((slot) => (
              <li key={slot.id} className={`${panelClass} flex flex-wrap items-center justify-between gap-2`}>
                <div>
                  <p className="font-semibold">{orderDate(slot.slot_date)} · {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)} WIB</p>
                  <p className="text-sm">Sisa kuota {slot.available} dari {slot.quota}</p>
                </div>
                <ActionButton disabled={busy} onClick={() => void run(async () => {
                  await apiDelete(`/tenant/time-slots/${slot.id}`);
                  slots.reload();
                })}>Hapus slot</ActionButton>
              </li>
            ))}
          </ul>
        ) : <p className={panelClass}>Belum ada slot untuk layanan ini.</p>)}
      </section>
    </>
  );
}

export default function VendorCalendar() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number>();
  const query = useApiQuery<Page<Service>>(`/tenant/services?page=${page}`);
  const services = query.data;
  const serviceId = services?.data.some((service) => service.id === selected) ? selected : services?.data[0]?.id;

  return (
    <section className="space-y-5">
      <PageHeading title="Kalender" />
      {query.loading && <LoadingData />}
      <RequestError message={query.error} retry={query.reload} />
      {services && (serviceId === undefined ? <p className={panelClass}>Tambah layanan untuk membuat jadwal.</p> : (
        <>
          <div className={`${panelClass} space-y-3`}>
            <Field label="Layanan">
              <select className={fieldClass} value={serviceId} onChange={(event) => setSelected(Number(event.target.value))}>
                {services.data.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>
            </Field>
            <Pagination current={services.meta.current_page} last={services.meta.last_page} onChange={setPage} />
          </div>
          <ServiceSlots key={serviceId} serviceId={serviceId} />
        </>
      ))}
    </section>
  );
}
