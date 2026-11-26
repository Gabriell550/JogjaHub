"use client";

import Image from "next/image";
import { useApiAction, useApiQuery } from "@/src/hooks/useApiRequest";
import { apiPatch, apiPost, type Resource } from "@/src/lib/api";
import { ActionButton, Field, fieldClass, LoadingData, panelClass, RequestError } from "@/src/components/shared/OperationsUi";
import type { Service, ServiceCategory } from "@/src/types/service";

interface Props {
  serviceId: number | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function ServiceForm({ serviceId, onSaved, onCancel }: Props) {
  const categories = useApiQuery<Resource<ServiceCategory[]>>("/categories");
  const detail = useApiQuery<Resource<Service>>(serviceId === null ? null : `/tenant/services/${serviceId}`);
  const { busy, error, run, setError } = useApiAction();
  const service = detail.data?.data;
  const photos = service?.photos ?? [];
  const hasSubcategories = categories.data?.data.some((category) => category.subcategories.length > 0);
  const loading = categories.loading || detail.loading;

  return (
    <section className={`${panelClass} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">{serviceId === null ? "Tambah layanan" : "Edit layanan"}</h2>
        <ActionButton onClick={onCancel} disabled={busy}>Batal</ActionButton>
      </div>
      {loading && <LoadingData />}
      <RequestError message={categories.error} retry={categories.reload} />
      <RequestError message={detail.error} retry={detail.reload} />
      {categories.data && !hasSubcategories && <p>Belum ada subkategori layanan.</p>}
      {hasSubcategories && (serviceId === null || service) && (
        <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const input = new FormData(form);
          const removals = input.getAll("remove_photos[]").map(String);
          const files = input.getAll("photos[]").filter((file): file is File => file instanceof File && Boolean(file.name));
          if (photos.length - removals.length + files.length > 10) {
            setError("Maksimal 10 foto total.");
            return;
          }
          if (files.some((file) => file.size > 5 * 1024 * 1024)) {
            setError("Ukuran setiap foto maksimal 5 MB.");
            return;
          }

          const payload = {
            name: String(input.get("name")).trim(),
            description: String(input.get("description")),
            subcategory_id: Number(input.get("subcategory_id")),
            price: Number(input.get("price")),
            price_type: String(input.get("price_type")),
            is_active: input.get("is_active") === "1",
          };
          if (!payload.name) {
            setError("Nama layanan wajib diisi.");
            return;
          }

          void run(async () => {
            const endpoint = serviceId === null ? "/tenant/services" : `/tenant/services/${serviceId}`;
            if (files.length) {
              const multipart = new FormData();
              Object.entries(payload).forEach(([key, value]) => multipart.set(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value)));
              photos.filter((photo) => removals.includes(photo.url)).forEach((photo) => multipart.append("remove_photos[]", photo.url));
              files.forEach((file) => multipart.append("photos[]", file));
              if (serviceId !== null) multipart.set("_method", "PUT");
              await apiPost(endpoint, multipart);
            } else if (serviceId === null) {
              await apiPost(endpoint, payload);
            } else {
              await apiPatch(endpoint, { ...payload, remove_photos: removals });
            }
            onSaved();
          });
        }}>
          <fieldset disabled={busy} className="min-w-0 space-y-4">
            <Field label="Nama layanan"><input className={fieldClass} name="name" required maxLength={255} defaultValue={service?.name} /></Field>
            <Field label="Deskripsi"><textarea className={fieldClass} name="description" rows={4} defaultValue={service?.description ?? ""} /></Field>
            <Field label="Subkategori">
              <select className={fieldClass} name="subcategory_id" required defaultValue={service?.subcategory?.id ?? ""}>
                <option value="">Pilih subkategori</option>
                {categories.data?.data.map((category) => (
                  <optgroup key={category.id} label={category.name}>
                    {category.subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Harga (Rp)"><input className={fieldClass} name="price" type="number" min={0} step="0.01" required defaultValue={service?.price} /></Field>
              <Field label="Tipe harga"><select className={fieldClass} name="price_type" defaultValue={service?.price_type ?? "per_session"}><option value="per_session">Per sesi</option><option value="per_night">Per malam</option></select></Field>
              <Field label="Status layanan"><select className={fieldClass} name="is_active" defaultValue={service?.is_active === false ? "0" : "1"}><option value="1">Aktif</option><option value="0">Nonaktif</option></select></Field>
            </div>
            {photos.length > 0 && (
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">Foto tersimpan</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {photos.map((photo, index) => (
                    <label key={photo.url} className="min-w-0 rounded-lg border border-[#DFE6F3] p-2 text-sm">
                      <Image src={photo.full_url} alt={`Foto layanan ${index + 1}`} width={180} height={120} unoptimized className="aspect-[3/2] w-full rounded-md object-cover" />
                      <span className="flex min-h-11 items-center gap-2"><input type="checkbox" name="remove_photos[]" value={photo.url} /> Hapus foto {index + 1}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <Field label="Tambah foto (maks. 10 foto total, 5 MB per foto)">
              <input className={fieldClass} name="photos[]" type="file" accept="image/jpeg,image/png,image/webp" multiple />
            </Field>
          </fieldset>
          <RequestError message={error} />
          <ActionButton type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan layanan"}</ActionButton>
        </form>
      )}
    </section>
  );
}
