"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/src/constants/routes";
import { apiGet } from "@/src/lib/api";
import type { Service, ServiceCategory } from "@/src/types/service";

interface CategoriesResponse {
  success: boolean;
  data: ServiceCategory[];
}

interface ServicesResponse {
  success: boolean;
  data: Service[];
}

function getServiceImage(service: Service) {
  return service.photos?.find((photo) => photo.is_primary)?.full_url ?? service.photos?.[0]?.full_url;
}

export function ServiceDiscovery() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoryError, setCategoryError] = useState("");
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryRequest, setCategoryRequest] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [servicesRequest, setServicesRequest] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    apiGet<CategoriesResponse>("/categories", controller.signal)
      .then((response) => setCategories(response.data))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setCategoryError(error instanceof Error ? error.message : "Kategori layanan gagal dimuat.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCategoriesLoading(false);
      });

    return () => controller.abort();
  }, [categoryRequest]);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams();
    const trimmedSearch = search.trim();
    if (trimmedSearch) query.set("q", trimmedSearch);
    if (selectedCategory !== null) query.set("category_id", String(selectedCategory));

    const timeout = window.setTimeout(() => {
      setServicesLoading(true);
      setServicesError("");
      const queryString = query.toString();
      const suffix = queryString ? `?${queryString}` : "";
      apiGet<ServicesResponse>(`/services${suffix}`, controller.signal)
        .then((response) => setServices(response.data))
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            setServicesError(error instanceof Error ? error.message : "Layanan gagal dimuat.");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setServicesLoading(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [search, selectedCategory, servicesRequest]);

  return (
    <section id="layanan" className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#F8F9FF]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#FF6B00]/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#1E293B]/5 blur-3xl" />
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <span id="kategori" className="scroll-mt-24" />
        <div className="mb-9 max-w-2xl">
          <p className="text-sm font-semibold uppercase text-[#A04100]">Layanan JogjaHub</p>
          <h2 className="font-display mt-3 text-3xl font-semibold text-[#121C2A] sm:text-4xl">Pilih kebutuhan wisudamu</h2>
          <p className="mt-4 leading-7 text-[#5A4136]">Jelajahi kategori dan layanan yang saat ini tersedia dari vendor lokal.</p>
        </div>

        <div role="group" aria-label="Kategori layanan" className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            aria-pressed={selectedCategory === null}
            onClick={() => setSelectedCategory(null)}
            className={`min-h-36 rounded-2xl border p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] motion-reduce:transform-none ${
              selectedCategory === null ? "border-[#FF6B00] bg-[#FFF0E5]" : "border-[#D3E2ED] bg-white hover:border-[#FF6B00]/60"
            }`}
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#FF6B00] text-lg font-bold text-white" aria-hidden="true">J</span>
            <span className="font-display mt-4 block text-lg font-semibold text-[#121C2A]">Semua kategori</span>
            <span className="mt-1 block text-sm text-[#5A4136]">Lihat seluruh layanan</span>
          </button>

          {categoriesLoading ? (
            <p role="status" className="rounded-2xl border border-[#D3E2ED] bg-white p-5 text-sm text-[#5A4136] sm:col-span-1 lg:col-span-3">Memuat kategori layanan...</p>
          ) : categoryError ? (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:col-span-1 lg:col-span-3">
              <p className="font-semibold text-red-800">Kategori belum dapat dimuat</p>
              <p className="mt-1 text-sm text-red-700">{categoryError}</p>
              <button type="button" onClick={() => { setCategoriesLoading(true); setCategoryError(""); setCategoryRequest((request) => request + 1); }} className="mt-3 min-h-11 font-semibold text-red-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800">Coba lagi</button>
            </div>
          ) : categories.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#8E7164]/50 bg-white p-5 text-sm text-[#5A4136] sm:col-span-1 lg:col-span-3">Belum ada kategori layanan yang tersedia.</p>
          ) : (
            categories.map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                  className={`min-h-36 rounded-2xl border p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] motion-reduce:transform-none ${
                    isSelected ? "border-[#FF6B00] bg-[#FFF0E5]" : "border-[#D3E2ED] bg-white hover:border-[#FF6B00]/60"
                  }`}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#1E293B] text-lg font-bold text-[#FBBF24]" aria-hidden="true">{category.name.slice(0, 1)}</span>
                  <span className="font-display mt-4 block text-lg font-semibold text-[#121C2A]">{category.name}</span>
                  <span className="mt-1 block text-sm text-[#5A4136]">
                    {category.subcategories.length > 0 ? category.subcategories.map((item) => item.name).join(" · ") : "Lihat layanan tersedia"}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div id="hasil-layanan" className="scroll-mt-24">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-display text-2xl font-semibold text-[#121C2A]">Layanan tersedia</h3>
              <p className="mt-1 text-sm text-[#5A4136]">Cari nama layanan, deskripsi, atau vendor.</p>
            </div>
            <form role="search" onSubmit={(event) => event.preventDefault()} className="flex w-full gap-2 sm:max-w-md">
              <label htmlFor="service-search" className="sr-only">Cari layanan atau vendor</label>
              <input
                id="service-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Contoh: fotografer, salon..."
                className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#8E7164]/50 bg-white px-4 text-sm text-[#121C2A] placeholder:text-[#5A4136] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]"
              />
              {search ? (
                <button type="button" onClick={() => setSearch("")} className="min-h-12 rounded-xl border border-[#D3E2ED] bg-white px-4 text-sm font-semibold text-[#121C2A] hover:bg-[#EFF4FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Hapus</button>
              ) : null}
            </form>
          </div>

          {servicesLoading ? (
            <p role="status" aria-live="polite" className="rounded-2xl border border-[#D3E2ED] bg-white p-8 text-center text-[#5A4136]">Memuat layanan...</p>
          ) : servicesError ? (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <h4 className="font-display text-lg font-semibold text-red-800">Layanan belum dapat dimuat</h4>
              <p className="mt-2 text-sm text-red-700">{servicesError}</p>
              <button type="button" onClick={() => { setServicesLoading(true); setServicesError(""); setServicesRequest((request) => request + 1); }} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#A04100] px-5 font-semibold text-white hover:bg-[#7B3200] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Coba lagi</button>
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#8E7164]/50 bg-white p-8 text-center">
              <h4 className="font-display text-lg font-semibold text-[#121C2A]">Layanan tidak ditemukan</h4>
              <p className="mt-2 text-sm text-[#5A4136]">Coba kata kunci atau kategori lain.</p>
              <button type="button" onClick={() => { setSearch(""); setSelectedCategory(null); }} className="mt-4 min-h-11 font-semibold text-[#A04100] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Tampilkan semua layanan</button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
                {services.map((service) => {
                  const image = getServiceImage(service);
                  return (
                    <Link
                      key={service.id}
                      href={`${ROUTES.services}/${service.id}`}
                      aria-label={`Lihat detail ${service.name}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#D3E2ED] bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#FF6B00]/60 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] motion-reduce:transform-none"
                    >
                      <div className="relative h-48 w-full overflow-hidden bg-[#EFF4FF]">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image} alt={service.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] motion-reduce:transform-none" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#FFF0E5_0%,#EFF4FF_100%)] text-sm font-semibold text-[#A04100]">{service.subcategory?.name ?? "Layanan JogjaHub"}</div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        {service.subcategory ? <p className="text-xs font-semibold uppercase text-[#A04100]">{service.subcategory.name}</p> : null}
                        <h4 className="font-display mt-1 text-lg font-semibold text-[#121C2A]">{service.name}</h4>
                        {service.tenant?.business_name ? <p className="mt-1 text-sm text-[#5A4136]">{service.tenant.business_name}</p> : null}
                        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-[#5A4136]">{service.description}</p>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <p className="font-display text-lg font-bold text-[#121C2A]">Rp{Number(service.price).toLocaleString("id-ID")}</p>
                          <span className="text-sm font-semibold text-[#A04100]">Lihat detail <span aria-hidden="true">-&gt;</span></span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <p className="mt-5 text-center text-sm text-[#5A4136]">Menampilkan layanan dari katalog JogjaHub.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
