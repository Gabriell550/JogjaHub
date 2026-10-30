import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ROUTES } from "@/src/constants/routes";
import { apiGet } from "@/src/lib/api";
import type { Service } from "@/src/types/service";

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
      <Link href={`${ROUTES.home}#layanan`} className="inline-flex min-h-11 items-center gap-2 font-semibold text-[#A04100] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">
        <span aria-hidden="true">&larr;</span> Kembali ke layanan
      </Link>
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
          <p className="mt-6 whitespace-pre-line leading-7 text-[#5A4136]">{service.description}</p>
          <p className="font-display mt-auto pt-8 text-2xl font-bold text-[#121C2A]">Rp{Number(service.price).toLocaleString("id-ID")}</p>
          <p className="mt-2 text-sm text-[#5A4136]">Informasi harga dan layanan mengikuti data yang ditampilkan oleh vendor.</p>
          <Link href={`${ROUTES.home}#layanan`} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#FF6B00] px-6 py-3 font-semibold text-[#121C2A] transition hover:-translate-y-0.5 hover:bg-[#E85F00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] motion-reduce:transform-none">
            Temukan layanan lainnya
          </Link>
        </div>
      </div>
    </article>
  );
}
