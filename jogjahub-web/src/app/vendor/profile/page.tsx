"use client";

import { useState } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { useApiAction, useApiQuery } from "@/src/hooks/useApiRequest";
import { apiPut, type Resource } from "@/src/lib/api";
import { approvalLabel, usePortalProfile } from "@/src/features/vendor/portalProfile";
import { PayoutDestinationForm } from "@/src/features/vendor/PayoutDestinationForm";
import { ActionButton, Field, fieldClass, LoadingData, PageHeading, panelClass, RequestError } from "@/src/components/shared/OperationsUi";
import type { ServiceCategory } from "@/src/types/service";

export default function VendorProfile() {
  const { session, logout } = useAuth();
  const { profile, updateProfile } = usePortalProfile();
  const categories = useApiQuery<Resource<ServiceCategory[]>>("/categories");
  const { busy, run, error, setError } = useApiAction();
  const [notice, setNotice] = useState("");
  const address = typeof profile.address === "string" ? { street: profile.address } : profile.address;
  const profileCategories = new Set(profile.categories?.map((category) => category.id));

  return (
    <section className="space-y-5">
      <PageHeading title="Manajemen Akun"><ActionButton onClick={logout}>Keluar</ActionButton></PageHeading>
      <div className={`${panelClass} grid gap-3 sm:grid-cols-2`}>
        <div className="min-w-0 break-words">
          <p className="text-sm text-[#4B596B]">Akun tenant</p>
          <p className="font-semibold">{session?.user.name}</p>
          <p className="text-sm">{session?.user.email}</p>
          {session?.user.phone && <p className="text-sm">{session.user.phone}</p>}
        </div>
        <div>
          <p className="text-sm text-[#4B596B]">Status toko</p>
          <p role="status" className="font-semibold">{approvalLabel[profile.status]}</p>
          {profile.status === "rejected" && profile.rejection_reason && <p className="mt-1 break-words text-sm">{profile.rejection_reason}</p>}
        </div>
      </div>
      {profile.status === "approved" && <PayoutDestinationForm />}
      <section className={`${panelClass} space-y-4`}>
        <h2 className="font-display text-xl font-semibold">Profil bisnis</h2>
        <p className="text-sm text-[#5A4136]">Setelah disimpan, profil kembali menunggu persetujuan dan operasi toko dijeda hingga admin menyetujuinya.</p>
        {categories.loading && <LoadingData />}
        <RequestError message={categories.error} retry={categories.reload} />
        {categories.data && (
          <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault();
            setNotice("");
            const fields = new FormData(event.currentTarget);
            const read = (name: string) => String(fields.get(name) ?? "").trim();
            const selected = fields.getAll("category_ids").map(Number);
            if (!selected.length) {
              setError("Pilih minimal satu kategori bisnis.");
              return;
            }
            void run(async () => {
              const result = await apiPut<Resource<typeof profile>>("/tenant/profile", {
                business_name: read("business_name"),
                description: read("description"),
                address: {
                  street: read("street"),
                  city: read("city"),
                  province: read("province"),
                  postal_code: read("postal_code"),
                },
                latitude: Number(read("latitude")),
                longitude: Number(read("longitude")),
                whatsapp_number: read("whatsapp_number"),
                category_ids: selected,
              });
              updateProfile(result.data);
              setNotice(result.message ?? "Profil berhasil disimpan.");
            });
          }}>
            <fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
              <Field label="Nama toko"><input className={fieldClass} name="business_name" required maxLength={255} defaultValue={profile.business_name} /></Field>
              <Field label="Nomor WhatsApp bisnis"><input className={fieldClass} name="whatsapp_number" type="tel" required maxLength={20} defaultValue={profile.whatsapp_number ?? ""} /></Field>
              <div className="sm:col-span-2"><Field label="Deskripsi"><textarea className={fieldClass} name="description" defaultValue={profile.description ?? ""} rows={4} /></Field></div>
              <Field label="Alamat jalan"><input className={fieldClass} name="street" required defaultValue={address?.street ?? ""} /></Field>
              <Field label="Kota atau kabupaten"><input className={fieldClass} name="city" required defaultValue={address?.city ?? ""} /></Field>
              <Field label="Provinsi">
                <select className={fieldClass} name="province" required defaultValue={address?.province === "DI Yogyakarta" ? "DI Yogyakarta" : "Daerah Istimewa Yogyakarta"}>
                  <option>Daerah Istimewa Yogyakarta</option><option>DI Yogyakarta</option>
                </select>
              </Field>
              <Field label="Kode pos"><input className={fieldClass} name="postal_code" defaultValue={address?.postal_code ?? address?.["Kode Pos"] ?? ""} /></Field>
              <Field label="Latitude"><input className={fieldClass} name="latitude" type="number" step="any" min={-8.5} max={-7.5} required defaultValue={profile.location?.latitude} /></Field>
              <Field label="Longitude"><input className={fieldClass} name="longitude" type="number" step="any" min={110} max={110.8} required defaultValue={profile.location?.longitude} /></Field>
              <fieldset className="min-w-0 sm:col-span-2">
                <legend className="text-sm font-semibold">Kategori bisnis</legend>
                {categories.data.data.length ? (
                  <div className="mt-2 grid gap-x-4 sm:grid-cols-2">
                    {categories.data.data.map((category) => (
                      <label className="flex min-h-11 items-center gap-2 text-sm" key={category.id}>
                        <input type="checkbox" name="category_ids" value={category.id} defaultChecked={profileCategories.has(category.id)} />
                        {category.name}
                      </label>
                    ))}
                  </div>
                ) : <p className="mt-2 text-sm">Belum ada kategori yang tersedia.</p>}
              </fieldset>
            </fieldset>
            <RequestError message={error} />
            {notice && <p role="status" className="text-sm text-green-800">{notice}</p>}
            <ActionButton type="submit" disabled={busy || !categories.data.data.length}>{busy ? "Menyimpan..." : "Simpan profil bisnis"}</ActionButton>
          </form>
        )}
      </section>
    </section>
  );
}
