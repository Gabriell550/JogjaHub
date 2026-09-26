import Link from "next/link";
import { ROUTES } from "@/src/constants/routes";

const navItems = [
  { href: `${ROUTES.home}#beranda`, label: "Beranda" },
  { href: `${ROUTES.home}#layanan`, label: "Layanan" },
  { href: `${ROUTES.home}#kategori`, label: "Kategori" },
  { href: `${ROUTES.home}#cara-kerja`, label: "Cara Kerja" },
  { href: `${ROUTES.home}#untuk-tenant`, label: "Untuk Tenant" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#E6EEFF] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href={ROUTES.home} className="font-display shrink-0 text-xl font-bold text-[#121C2A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A04100]">
          <span className="text-[#FF6B00]">Jogja</span>Hub
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-5 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap text-sm font-medium text-[#5A4136] transition hover:text-[#A04100] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A04100]">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link href={ROUTES.login} className="inline-flex min-h-10 items-center rounded-md border border-[#8E7164]/50 px-4 text-sm font-semibold text-[#121C2A] transition hover:border-[#A04100] hover:bg-[#FFF8F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">
            Masuk
          </Link>
          <Link href={ROUTES.register} className="inline-flex min-h-10 items-center rounded-md bg-[#FF6B00] px-4 text-sm font-semibold text-[#121C2A] transition hover:bg-[#E85F00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">
            Daftar
          </Link>
        </div>

        <details className="group relative lg:hidden">
          <summary aria-label="Buka menu navigasi" className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-md border border-[#D3E2ED] text-[#121C2A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] [&::-webkit-details-marker]:hidden">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </summary>
          <nav aria-label="Navigasi utama" className="absolute right-0 top-14 z-50 flex w-64 flex-col gap-1 border border-[#D3E2ED] bg-white p-3 shadow-xl lg:hidden">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-3 py-2.5 text-sm font-medium text-[#121C2A] hover:bg-[#F8F9FF] focus-visible:outline-2 focus-visible:outline-[#A04100]">
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#E6EEFF] pt-3">
              <Link href={ROUTES.login} className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#8E7164]/50 px-3 text-sm font-semibold text-[#121C2A]">Masuk</Link>
              <Link href={ROUTES.register} className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#FF6B00] px-3 text-sm font-semibold text-[#121C2A]">Daftar</Link>
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
