import Link from "next/link";
import { ROUTES } from "@/src/constants/routes";

export function Footer() {
  return (
    <footer className="bg-[#0F172A] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-12 lg:py-14">
        <div className="max-w-xs">
          <Link href={ROUTES.home} className="font-display text-xl font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FBBF24]">
            <span className="text-[#FF6B00]">Jogja</span>Hub
          </Link>
          <p className="mt-4 text-sm leading-6 text-slate-300">Teman persiapan wisuda. Temukan layanan lokal Yogyakarta dalam satu tempat.</p>
        </div>
        <div>
          <h2 className="font-display text-sm font-semibold text-white">Produk</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li><Link href={`${ROUTES.home}#kategori`} className="hover:text-white">Kategori layanan</Link></li>
            <li><Link href={`${ROUTES.home}#cara-kerja`} className="hover:text-white">Cara kerja</Link></li>
            <li><Link href={ROUTES.login} className="hover:text-white">Masuk customer</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-sm font-semibold text-white">Bergabung</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li><Link href={`${ROUTES.register}?role=tenant`} className="hover:text-white">Untuk tenant</Link></li>
            <li><Link href={ROUTES.register} className="hover:text-white">Buat akun</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-sm font-semibold text-white">JogjaHub</h2>
          <p className="mt-4 text-sm leading-6 text-slate-300">Mendukung usaha lokal dan momen wisuda yang lebih tertata.</p>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto max-w-7xl px-5 py-5 text-xs text-slate-400 sm:px-8 lg:px-12">2026 JogjaHub. Dibuat untuk wisudawan Yogyakarta.</div>
      </div>
    </footer>
  );
}
