import Image from "next/image";
import Link from "next/link";
import { ServiceDiscovery } from "@/src/components/landing/ServiceDiscovery";

export default function CustomerDashboardPage() {
  return (
    <>
      <section className="px-4 pt-5 sm:px-6 sm:pt-7 lg:px-8">
        <div className="grid overflow-hidden rounded-2xl bg-[linear-gradient(112deg,#FF6B00_0%,#A04100_58%,#0F172A_100%)] text-white shadow-lg md:grid-cols-[1fr_0.8fr]">
          <div className="flex flex-col items-start justify-center p-6 sm:p-8 lg:p-10">
            <p className="rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-semibold">Vendor lokal Yogyakarta</p>
            <h1 className="font-display mt-4 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">Booking kebutuhan wisuda di Jogja lebih mudah.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/90 sm:text-base">Cari MUA, fotografer, penginapan, dan gifting dari layanan yang tersedia.</p>
            <Link href="#layanan" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-bold text-[#7B3200] shadow-md transition hover:-translate-y-0.5 hover:bg-[#FFF8F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transform-none">Jelajahi layanan</Link>
          </div>
          <div className="relative min-h-44 overflow-hidden border-t border-white/20 md:min-h-0 md:border-l md:border-t-0">
            <Image
              src="/images/hero-wisuda.png"
              alt="Banner JogjaHub tentang MUA, fotografer, kebaya, dan layanan wisuda"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>
      <ServiceDiscovery />
    </>
  );
}
