"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/src/constants/routes";
import { formatAddress } from "@/src/lib/formatAddress";
import { apiGet } from "@/src/lib/api";
import type { PaginatedServices, Service, ServiceCategory } from "@/src/types/service";

interface CategoriesResponse {
  success: boolean;
  data: ServiceCategory[];
}

interface ServicesResponse extends PaginatedServices {
  success: boolean;
  links: { prev: string | null; next: string | null };
}

function getServiceImage(service: Service) {
  return service.photos?.find((photo) => photo.is_primary)?.full_url ?? service.photos?.[0]?.full_url;
}

function CategoryFilters({
  categories,
  selectedCategory,
  onSelect,
}: {
  categories: ServiceCategory[];
  selectedCategory: number | null;
  onSelect: (categoryId: number | null) => void;
}) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        aria-pressed={selectedCategory === null}
        onClick={() => onSelect(null)}
        className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] ${
          selectedCategory === null ? "bg-[#FFF0E5] text-[#7B3200]" : "text-[#263449] hover:bg-[#F3F6FC]"
        }`}
      >
        <span>Semua kategori</span>
      </button>
      {categories.map((category) => {
        const selected = selectedCategory === category.id;
        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(selected ? null : category.id)}
            className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] ${
              selected ? "bg-[#FFF0E5] text-[#7B3200]" : "text-[#263449] hover:bg-[#F3F6FC]"
            }`}
          >
            <span>{category.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ServiceDiscovery() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoryError, setCategoryError] = useState("");
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryRequest, setCategoryRequest] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [pagination, setPagination] = useState<PaginatedServices["meta"] | null>(null);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [servicesRequest, setServicesRequest] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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
    const query = new URLSearchParams({ page: String(page) });
    const trimmedSearch = search.trim();
    if (trimmedSearch) query.set("q", trimmedSearch);
    if (selectedCategory !== null) query.set("category_id", String(selectedCategory));

    const timeout = window.setTimeout(() => {
      setServicesLoading(true);
      setServicesError("");
      apiGet<ServicesResponse>(`/services?${query.toString()}`, controller.signal)
        .then((response) => {
          setServices(response.data);
          setPagination(response.meta);
        })
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
  }, [search, selectedCategory, page, servicesRequest]);

  function selectCategory(categoryId: number | null) {
    setSelectedCategory(categoryId);
    setPage(1);
  }

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setSelectedCategory(null);
    setPage(1);
  }

  return (
    <section id="layanan" className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#F0F4FF]">
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#A04100]">Katalog JogjaHub</p>
          <h2 className="font-display mt-2 text-3xl font-semibold text-[#121C2A] sm:text-4xl">Temukan layanan wisuda</h2>
          <p className="mt-3 leading-7 text-[#5A4136]">Cari layanan dari Tenant lokal Yogyakarta dan pilih kategori yang sesuai kebutuhanmu.</p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="hidden rounded-2xl border border-[#E1E8F7] bg-white p-5 shadow-sm lg:block">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-[#121C2A]">Filter kategori</h3>
              {(selectedCategory !== null || search) ? (
                <button type="button" onClick={resetFilters} className="text-xs font-semibold text-[#A04100] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Reset</button>
              ) : null}
            </div>
            {categoriesLoading ? <p role="status" className="text-sm text-[#5A4136]">Memuat kategori...</p> : null}
            {categoryError ? (
              <div role="alert" className="text-sm text-red-800">
                <p>Kategori gagal dimuat: {categoryError}</p>
                <button type="button" onClick={() => { setCategoriesLoading(true); setCategoryError(""); setCategoryRequest((request) => request + 1); }} className="mt-2 min-h-11 font-semibold underline underline-offset-2">Coba lagi</button>
              </div>
            ) : null}
            {!categoriesLoading && !categoryError && categories.length === 0 ? <p className="text-sm text-[#5A4136]">Belum ada kategori.</p> : null}
            {!categoriesLoading && !categoryError && categories.length > 0 ? <CategoryFilters categories={categories} selectedCategory={selectedCategory} onSelect={selectCategory} /> : null}
            <p className="mt-5 border-t border-[#E6EEFF] pt-4 text-xs leading-5 text-[#5A4136]">Lokasi dan rentang harga belum tersedia sebagai filter pada katalog.</p>
          </aside>

          <div className="min-w-0">
            <details className="mb-4 rounded-xl border border-[#E1E8F7] bg-white p-4 shadow-sm lg:hidden">
              <summary className="min-h-8 cursor-pointer font-semibold text-[#121C2A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">
                Filter kategori{selectedCategory !== null ? ` · ${categories.find((category) => category.id === selectedCategory)?.name ?? "aktif"}` : ""}
              </summary>
              <div className="mt-3">
                {categoriesLoading ? <p role="status" className="text-sm text-[#5A4136]">Memuat kategori...</p> : null}
                {categoryError ? (
                  <div role="alert" className="text-sm text-red-800">
                    <p>Kategori gagal dimuat: {categoryError}</p>
                    <button type="button" onClick={() => { setCategoriesLoading(true); setCategoryError(""); setCategoryRequest((request) => request + 1); }} className="mt-2 min-h-11 font-semibold underline underline-offset-2">Coba lagi</button>
                  </div>
                ) : null}
                {!categoriesLoading && !categoryError && categories.length > 0 ? <CategoryFilters categories={categories} selectedCategory={selectedCategory} onSelect={selectCategory} /> : null}
                <p className="mt-3 text-xs leading-5 text-[#5A4136]">Filter lokasi dan rentang harga belum tersedia pada katalog.</p>
                {(selectedCategory !== null || search) ? <button type="button" onClick={resetFilters} className="mt-3 min-h-11 font-semibold text-[#A04100] underline underline-offset-2">Reset filter</button> : null}
              </div>
            </details>

            <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-[#E1E8F7] bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-5">
              <div>
                <h3 className="font-display text-xl font-semibold text-[#121C2A]">Layanan pilihan di Jogja</h3>
                <p className="mt-1 text-sm text-[#5A4136]">
                  {pagination ? `${pagination.total} layanan ditemukan` : "Pilih layanan yang sesuai kebutuhan"}
                  {selectedCategory !== null ? ` · ${categories.find((category) => category.id === selectedCategory)?.name ?? ""}` : ""}
                </p>
              </div>
              <form role="search" onSubmit={(event) => event.preventDefault()} className="flex w-full gap-2 sm:max-w-md">
                <label htmlFor="service-search" className="sr-only">Cari layanan atau vendor</label>
                <input
                  id="service-search"
                  type="search"
                  value={search}
                  onChange={(event) => changeSearch(event.target.value)}
                  placeholder="Cari MUA, penginapan, vendor..."
                  className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#B8C2D3] bg-white px-4 text-sm text-[#121C2A] placeholder:text-[#5A6472] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]"
                />
                {search ? <button type="button" onClick={() => changeSearch("")} className="min-h-11 rounded-xl border border-[#D3E2ED] px-3 text-sm font-semibold text-[#121C2A] hover:bg-[#EFF4FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Hapus</button> : null}
              </form>
            </div>

            {servicesLoading ? (
              <div role="status" aria-live="polite" className="rounded-2xl border border-[#E1E8F7] bg-white p-10 text-center text-[#5A4136]">Memuat layanan...</div>
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
                <button type="button" onClick={resetFilters} className="mt-4 min-h-11 font-semibold text-[#A04100] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Tampilkan semua layanan</button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {services.map((service) => {
                    const image = getServiceImage(service);
                    return (
                      <Link
                        key={service.id}
                        href={`${ROUTES.services}/${service.id}`}
                        aria-label={`Lihat detail ${service.name}`}
                        className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E1E8F7] bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#FF6B00]/60 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] motion-reduce:transform-none"
                      >
                        <div className="relative h-44 w-full overflow-hidden bg-[#EFF4FF]">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt={service.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] motion-reduce:transform-none" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#FFF0E5_0%,#EFF4FF_100%)] text-sm font-semibold text-[#A04100]">{service.subcategory?.name ?? "Layanan JogjaHub"}</div>
                          )}
                          {service.subcategory ? <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#253449] shadow-sm">{service.subcategory.name}</span> : null}
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          <h4 className="font-display line-clamp-2 text-base font-semibold text-[#121C2A]">{service.name}</h4>
                          <p className="mt-1 text-sm text-[#4B596B]">{service.tenant?.business_name ?? "Vendor JogjaHub"}</p>
                          {service.tenant ? <p className="mt-2 line-clamp-1 text-xs text-[#4B596B]">{formatAddress(service.tenant.address)}</p> : null}
                          <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-[#4B596B]">{service.description}</p>
                          <div className="mt-4 flex items-end justify-between gap-2 border-t border-[#E6EEFF] pt-3">
                            <p>
                              <span className="block text-xs text-[#4B596B]">Mulai dari</span>
                              <span className="font-display text-base font-bold text-[#121C2A]">Rp{Number(service.price).toLocaleString("id-ID")}</span>
                            </p>
                            {service.reviews_avg_rating != null ? (
                              <span className="text-xs font-semibold text-[#263449]" aria-label={`Rating ${service.reviews_avg_rating} dari 5`}>
                                <span aria-hidden="true">★</span> {Number(service.reviews_avg_rating).toFixed(1)}
                                {service.reviews_count ? ` (${service.reviews_count})` : ""}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {pagination && pagination.last_page > 1 ? (
                  <nav aria-label="Halaman katalog layanan" className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="min-h-11 rounded-lg border border-[#B8C2D3] bg-white px-4 text-sm font-semibold text-[#121C2A] hover:bg-[#F8F9FF] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Sebelumnya</button>
                    <span aria-live="polite" className="text-sm text-[#263449]">Halaman {pagination.current_page} dari {pagination.last_page}</span>
                    <button type="button" disabled={page >= pagination.last_page} onClick={() => setPage((current) => Math.min(pagination.last_page, current + 1))} className="min-h-11 rounded-lg bg-[#0F172A] px-4 text-sm font-semibold text-white hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Selanjutnya</button>
                  </nav>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
