import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/src/constants/routes";
import { RevealOnScroll } from "@/src/components/shared/RevealOnScroll";
import { ServiceDiscovery } from "@/src/components/landing/ServiceDiscovery";

const steps = [
  { number: "01", title: "Pilih layanan", description: "Jelajahi vendor dan layanan sesuai kebutuhan wisudamu." },
  { number: "02", title: "Atur jadwal", description: "Pilih tanggal dan slot waktu, termasuk jadwal dini hari." },
  { number: "03", title: "Booking dengan tenang", description: "Kirim pesanan dan tunggu konfirmasi langsung dari vendor." },
];

const proofPoints = [
  { value: "Layanan", label: "untuk persiapan wisuda" },
  { value: "Vendor", label: "lokal Yogyakarta" },
  { value: "Jadwal", label: "yang dapat dipilih" },
  { value: "Harga", label: "ditampilkan transparan" },
];

const valueProps = [
  { title: "Vendor Terverifikasi", description: "Setiap tenant melalui proses approval sebelum tampil ke customer.", icon: "verified" },
  { title: "Booking Real-time", description: "Lihat slot yang benar-benar tersedia, tanpa bentrok jadwal.", icon: "schedule" },
  { title: "Harga Transparan", description: "Harga layanan ditampilkan jelas sebelum kamu booking.", icon: "price" },
  { title: "Dukungan Lokal Jogja", description: "Semua vendor adalah usaha lokal Yogyakarta.", icon: "local" },
] as const;

const whyChooseUs = [
  { title: "Vendor Lokal Terpercaya", description: "Temukan pilihan layanan dari tenant lokal yang telah melalui proses persetujuan." },
  { title: "Booking Tanpa Antre Dini Hari", description: "Atur layanan dan pilih slot waktu lebih awal untuk hari wisudamu." },
  { title: "Semua Kebutuhan dalam 1 Platform", description: "Jelajahi Beauty & Style, penginapan, dan gifting di satu tempat." },
  { title: "Dukungan Responsif", description: "Informasi layanan dan jadwal membantu persiapanmu berjalan lebih terarah." },
];

function ValuePropIcon({ type }: { type: (typeof valueProps)[number]["icon"] }) {
  const iconPaths = {
    verified: <><path d="M12 3 4.5 6v5c0 5 3.2 8.2 7.5 10 4.3-1.8 7.5-5 7.5-10V6L12 3Z" /><path d="m8.5 12 2.2 2.2 4.8-4.8" /></>,
    schedule: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    price: <><circle cx="12" cy="12" r="9" /><path d="M15 8.5c-.7-.7-1.7-1-3-1-1.6 0-2.7.8-2.7 2s1.1 1.8 2.7 2 2.7.8 2.7 2-1.1 2-2.7 2c-1.3 0-2.3-.4-3-1.1M12 6v12" /></>,
    local: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {iconPaths[type]}
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="-mt-8">
      <section id="beranda" className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#0F172A] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#FF6B00]/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-[#FBBF24]/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_0.92fr] lg:gap-16 lg:px-12 lg:py-24">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-[#FBBF24]" aria-hidden="true" />
              Persiapan wisuda di Yogyakarta
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.12] sm:text-5xl lg:text-[3.5rem]">
              Semua kebutuhan wisudamu, <span className="text-[#FBBF24]">satu platform.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
              Dari MUA dan butik, penginapan dekat kampus, hingga buket dan hadiah. Atur semuanya secara online tanpa antre dini hari.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#layanan" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 font-semibold text-[#121C2A] shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:bg-[#E85F00] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FBBF24] motion-reduce:transform-none">
                Cari Layanan <span aria-hidden="true">-&gt;</span>
              </Link>
              <Link href={ROUTES.registerTenant} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-6 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FBBF24] motion-reduce:transform-none">
                Daftar sebagai Tenant
              </Link>
            </div>
            <p className="mt-5 text-sm text-slate-300">Gratis untuk customer. Mulai persiapan wisuda tanpa ribet.</p>
          </div>

          <div className="relative mx-auto w-full max-w-2xl">
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-[#1E293B] shadow-2xl">
              <Image
                src="/images/hero-wisuda.png"
                alt="Promosi JogjaHub untuk persiapan wisuda: layanan MUA, fotografer, kebaya, dan pemesanan"
                width={609}
                height={352}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-auto w-full"
              />
            </div>
            <p className="mt-3 text-center text-xs text-white/70">Persiapan wisuda jadi lebih mudah bersama vendor lokal Jogja.</p>
          </div>
        </div>
      </section>

      <section aria-label="Keunggulan JogjaHub" className="relative left-1/2 w-screen -translate-x-1/2 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:grid-cols-2 sm:px-8 sm:py-16 lg:grid-cols-4 lg:px-12">
          {valueProps.map((item, index) => (
            <RevealOnScroll key={item.title} delayMs={index * 100}>
              <div className="flex h-full flex-col items-start border-t-2 border-[#FF6B00] pt-5">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#FFF0E5] text-[#A04100]">
                  <ValuePropIcon type={item.icon} />
                </span>
                <h2 className="font-display mt-4 text-lg font-semibold text-[#121C2A]">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#5A4136]">{item.description}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <section aria-label="JogjaHub dalam angka" className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-b border-[#E6EEFF] bg-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle, #A0410022 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-7 px-5 py-8 sm:grid-cols-4 sm:px-8 lg:px-12">
          {proofPoints.map((point, index) => (
            <RevealOnScroll key={point.label} delayMs={index * 100} className="text-center sm:border-r sm:border-[#E6EEFF] sm:last:border-r-0">
              <div>
                <p className="font-display text-2xl font-bold text-[#A04100] sm:text-3xl">{point.value}</p>
                <p className="mt-1 text-sm text-[#5A4136]">{point.label}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <ServiceDiscovery />

      <section id="cara-kerja" className="relative left-1/2 w-screen -translate-x-1/2 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase text-[#A04100]">Mudah dari awal</p>
            <h2 className="font-display mt-3 text-3xl font-semibold text-[#121C2A] sm:text-4xl">Persiapan wisuda dalam 3 langkah</h2>
          </div>
          <ol className="grid gap-8 md:grid-cols-3 md:gap-10">
            {steps.map((step, index) => (
              <RevealOnScroll key={step.number} delayMs={index * 150}>
                <li className="border-t-2 border-[#FF6B00] pt-5">
                  <span className="font-display text-sm font-bold text-[#A04100]">{step.number}</span>
                  <h3 className="font-display mt-3 text-xl font-semibold text-[#121C2A]">{step.title}</h3>
                  <p className="mt-2 leading-7 text-[#5A4136]">{step.description}</p>
                </li>
              </RevealOnScroll>
            ))}
          </ol>
        </div>
      </section>

      <section aria-label="Kenapa pilih JogjaHub" className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#F8F9FF]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:px-12">
          <RevealOnScroll className="relative min-h-[320px] overflow-hidden rounded-2xl bg-[#1E293B]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1627556704353-016baeb12c79?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Tiga wisudawan berfoto bersama di depan gedung kampus"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/85 via-[#0F172A]/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
              <p className="font-display text-2xl font-semibold">Wisuda tanpa ribet</p>
              <p className="mt-1 text-sm text-white/85">Semua persiapan, satu platform.</p>
              <a href="https://unsplash.com/@rutmiit" target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-white/75 underline underline-offset-4 hover:text-white">Foto oleh RUT MIIT di Unsplash</a>
            </div>
          </RevealOnScroll>
          <div className="grid gap-4 sm:grid-cols-2">
            {whyChooseUs.map((item, index) => (
              <RevealOnScroll key={item.title} delayMs={index * 100} className="rounded-2xl border border-[#D3E2ED] bg-white p-5">
                <h2 className="font-display text-base font-semibold text-[#121C2A]">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#5A4136]">{item.description}</p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section id="untuk-tenant" className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#1E293B] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[#FBBF24]/15 blur-3xl" />
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-14 sm:px-8 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <RevealOnScroll className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-[#FBBF24]">Untuk pemilik usaha lokal</p>
            <h2 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">Buka toko gratis di JogjaHub</h2>
            <p className="mt-4 leading-7 text-slate-200">Jangkau calon pelanggan yang sedang mempersiapkan wisuda dan kelola pesanan dari satu tempat.</p>
            <ul className="mt-5 grid gap-2 text-sm text-slate-100 sm:grid-cols-2">
              <li><span className="mr-2 text-[#FBBF24]" aria-hidden="true">+</span>Profil bisnis mudah ditemukan</li>
              <li><span className="mr-2 text-[#FBBF24]" aria-hidden="true">+</span>Kelola layanan dan jadwal</li>
            </ul>
          </RevealOnScroll>
          <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
            <Link href={ROUTES.registerTenant} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#FF6B00] px-6 py-3 font-semibold text-[#121C2A] shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-[#E85F00] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FBBF24] motion-reduce:transform-none">
              Daftar sebagai Tenant
            </Link>
            <p className="text-sm text-slate-300">Verifikasi maksimal 1x24 jam</p>
          </div>
        </div>
      </section>

      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#FFF8F2]">
        <div aria-hidden="true" className="pointer-events-none absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-[#FF6B00]/10 blur-3xl" />
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-5 py-12 sm:px-8 sm:py-14 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <RevealOnScroll>
            <p className="text-sm font-semibold uppercase text-[#A04100]">Satu langkah lebih dekat</p>
            <h2 className="font-display mt-2 text-2xl font-semibold text-[#121C2A] sm:text-3xl">Rencanakan hari wisuda yang berkesan.</h2>
          </RevealOnScroll>
          <Link href={ROUTES.login} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#FF6B00] px-6 py-3 font-semibold text-[#121C2A] transition duration-200 hover:-translate-y-0.5 hover:bg-[#E85F00] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A04100] motion-reduce:transform-none">
            Mulai cari layanan
          </Link>
        </div>
      </section>
    </div>
  );
}
