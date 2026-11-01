import Image from "next/image";
import { notFound } from "next/navigation";
import { apiGet } from "@/src/lib/api";
import { formatAddress } from "@/src/lib/formatAddress";
import type { Service } from "@/src/types/service";
import { ServiceBackLink } from "@/src/components/customer/ServiceBackLink";
import { ServiceBookingPanel } from "@/src/components/customer/ServiceBookingPanel";

interface ServiceResponse {
  success: boolean;
  data: Service;
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const response = await apiGet<ServiceResponse>(`/services/${id}`);
  const service = response.data;
  const photo = service.photos?.find((item) => item.is_primary) ?? service.photos?.[0];

  return (
    <article className="mx-auto max-w-5xl py-8 sm:py-12">
      <ServiceBackLink />
      <div className="mt-6 grid overflow-hidden rounded-3xl border border-[#D3E2ED] bg-white shadow-sm lg:grid-cols-2">
        <div className="relative min-h-72 bg-[#EFF4FF] sm:min-h-96">
          {photo ? (
            <Image
              src={photo.full_url}
              alt={service.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <div className="flex h-full min-h-72 items-center justify-center bg-[linear-gradient(135deg,#FFF0E5_0%,#EFF4FF_100%)] p-8 text-center font-semibold text-[#A04100]">
              {service.subcategory?.name ?? "Layanan JogjaHub"}
            </div>
          )}
        </div>
        <div className="flex flex-col p-6 sm:p-9">
          {service.subcategory ? <p className="text-sm font-semibold uppercase text-[#A04100]">{service.subcategory.name}</p> : null}
          <h1 className="font-display mt-3 text-3xl font-bold text-[#121C2A] sm:text-4xl">{service.name}</h1>
          {service.tenant?.business_name ? <p className="mt-3 text-base font-medium text-[#5A4136]">{service.tenant.business_name}</p> : null}
          {service.tenant ? <p className="mt-2 text-sm text-[#4B596B]">{formatAddress(service.tenant.address)}</p> : null}
          {service.reviews_avg_rating != null ? (
            <p className="mt-3 text-sm font-semibold text-[#263449]" aria-label={`Rating ${service.reviews_avg_rating} dari 5 berdasarkan ${service.reviews_count ?? 0} ulasan`}>
              <span aria-hidden="true">★</span> {Number(service.reviews_avg_rating).toFixed(1)} dari 5
              {service.reviews_count ? ` · ${service.reviews_count} ulasan` : ""}
            </p>
          ) : null}
          <p className="mt-6 whitespace-pre-line leading-7 text-[#5A4136]">{service.description}</p>
          <p className="font-display mt-auto pt-8 text-2xl font-bold text-[#121C2A]">Rp{Number(service.price).toLocaleString("id-ID")}</p>
          <p className="mt-2 text-sm text-[#4B596B]">Harga layanan mengikuti data vendor. Pembayaran diproses melalui halaman pembayaran dari backend.</p>
          <ServiceBookingPanel serviceId={service.id} subcategoryId={service.subcategory?.id} />
        </div>
      </div>
    </article>
  );
}
