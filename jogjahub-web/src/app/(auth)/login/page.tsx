"use client";

import { Suspense, type FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/hooks/useAuth";
import { ROUTES } from "@/src/constants/routes";

type LoginRole = "customer" | "tenant";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [role, setRole] = useState<LoginRole>(() => searchParams.get("role") === "tenant" ? "tenant" : "customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState(() => searchParams.get("registered") === "tenant" ? "Registrasi berhasil! Akunmu sedang menunggu approval admin sebelum bisa login." : "");
  const [statusVariant, setStatusVariant] = useState<"error" | "info">(() => searchParams.get("registered") === "tenant" ? "info" : "error");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setStatusVariant("error");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    if (password.length < 6) {
      setError("Kata sandi harus terdiri dari minimal 6 karakter.");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await login({ email: email.trim(), password, role });
      if (session.user.role === "tenant" && session.tenantStatus !== "approved") {
        setStatusVariant("info");
        setError(session.tenantStatus === "rejected"
          ? "Pendaftaran akun tenant kamu ditolak admin. Hubungi admin untuk info lebih lanjut."
          : "Akun tenant kamu masih menunggu approval admin. Kamu akan diberi tahu setelah disetujui.");
        return;
      }
      router.push(session.user.role === "customer" ? ROUTES.dashboard : ROUTES.vendor);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login gagal. Periksa kembali data akunmu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-dvh bg-[#F7F8FC] lg:grid-cols-[1.04fr_0.96fr]">
      <section className="relative flex flex-col overflow-hidden bg-[radial-gradient(ellipse_at_18%_16%,#0d4263_0%,#062b45_44%,#05223a_100%)] px-6 py-6 text-white sm:px-10 sm:py-8 lg:min-h-dvh lg:px-12 lg:py-10" aria-label="Tentang JogjaHub">
        <div aria-hidden="true" className="pointer-events-none absolute -left-36 top-1/4 h-80 w-80 rounded-full bg-[#0B5A7D]/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#0B4567]/35 blur-3xl" />

        <Link href={ROUTES.home} className="relative z-10 inline-flex w-fit items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FBBF24]">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FF6B00] text-white shadow-lg shadow-black/15">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3 8 4.2v9.6L12 21l-8-4.2V7.2L12 3Z" />
              <path d="m8.5 10 3.5-2 3.5 2-3.5 2-3.5-2Z" />
              <path d="M12 12v4" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="font-display block text-lg font-bold tracking-tight">JogjaHub</span>
            <span className="block text-[11px] text-sky-100/70">Wisuda Marketplace Jogja</span>
          </span>
        </Link>

        <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-8 text-center lg:py-6">
          <div className="relative mx-auto mb-4 w-full max-w-[500px] sm:mb-5">
            <div className="absolute left-0 top-[16%] z-10 hidden -rotate-3 items-center gap-2 rounded-xl border border-white/60 bg-white px-3 py-2 text-left text-[#14243A] shadow-lg shadow-black/15 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#FFF0E5] text-[#D95000]">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></svg>
              </span>
              <span><span className="block text-[11px] font-bold">Beauty &amp; Style</span><span className="block text-[9px] text-slate-500">Tampil percaya diri</span></span>
            </div>
            <div className="absolute right-0 top-[18%] z-10 hidden rotate-3 items-center gap-2 rounded-xl border border-white/60 bg-white px-3 py-2 text-left text-[#14243A] shadow-lg shadow-black/15 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#E7F1FF] text-[#265A9D]">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></svg>
              </span>
              <span><span className="block text-[11px] font-bold">Penginapan</span><span className="block text-[9px] text-slate-500">Nyaman untuk keluarga</span></span>
            </div>
            <div className="absolute bottom-[13%] left-1 z-10 hidden -rotate-2 items-center gap-2 rounded-xl border border-white/60 bg-white px-3 py-2 text-left text-[#14243A] shadow-lg shadow-black/15 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#E7F1FF] text-[#265A9D]">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M5 8h14M5 16h14" /><path d="M5 8c0 3 2 5 7 5s7 2 7 3M19 8c0 3-2 5-7 5s-7 2-7 3" /></svg>
              </span>
              <span><span className="block text-[11px] font-bold">Gifting</span><span className="block text-[9px] text-slate-500">Kenangan penuh makna</span></span>
            </div>

            <svg viewBox="0 0 520 340" role="img" aria-labelledby="graduation-art-title" className="mx-auto h-40 w-full max-w-[390px] drop-shadow-[0_24px_36px_rgba(0,0,0,0.2)] sm:h-64 sm:max-w-[480px] lg:h-[310px]">
              <title id="graduation-art-title">Ilustrasi perayaan wisuda di Jogja</title>
              <defs>
                <linearGradient id="stage" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#0A4164" /><stop offset="1" stopColor="#07304F" /></linearGradient>
                <linearGradient id="gown" x1="0" x2="1"><stop stopColor="#14273C" /><stop offset="1" stopColor="#243B54" /></linearGradient>
              </defs>
              <ellipse cx="260" cy="279" rx="177" ry="25" fill="#021A2B" opacity=".55" />
              <ellipse cx="260" cy="228" rx="142" ry="90" fill="url(#stage)" />
              <ellipse cx="260" cy="216" rx="104" ry="56" fill="#FFB547" opacity=".14" />
              <circle cx="92" cy="95" r="3" fill="#FF6B00" /><circle cx="417" cy="105" r="3" fill="#8CCBFF" /><circle cx="380" cy="52" r="2" fill="#FFCE70" /><circle cx="133" cy="68" r="2" fill="#8CCBFF" />
              <path d="m260 58 5 13 14 1-11 8 4 14-12-8-12 8 4-14-11-8 14-1 5-13Z" fill="#FF6B00" />
              <path d="m120 126 3 8 9 1-7 5 3 9-8-5-8 5 3-9-7-5 9-1 3-8Zm286 26 2 6 7 1-6 4 2 6-5-4-6 4 2-6-5-4 6-1 3-6Z" fill="#FF6B00" />
              <path d="M87 282h346v15H87z" fill="#031D30" opacity=".75" />
              <path d="M140 274c4-26 20-40 42-40s38 14 42 40" fill="url(#gown)" />
              <circle cx="182" cy="219" r="22" fill="#17283B" />
              <path d="m160 206 22-18 25 15-2 7-25-10-19 14-7-4 6-4Z" fill="#0B1725" />
              <path d="M302 274c4-26 20-40 42-40s38 14 42 40" fill="url(#gown)" />
              <circle cx="344" cy="219" r="22" fill="#17283B" />
              <path d="m320 203 23-16 25 15-2 7-25-10-19 14-7-4 5-6Z" fill="#0B1725" />
              <path d="m246 145 14-12 14 12-6 10-2 42h20l-19 53h-32l-19-53h20l-2-42-6-10 18-14Z" fill="#F7F8FC" />
              <path d="m244 152 16-8-3 35-6 13-7-13v-27Z" fill="#FF6B00" />
              <path d="M233 239h56l-5 13h-46l-5-13Zm-8 18h73l-6 12h-61l-6-12Z" fill="#A8C9E8" />
              <circle cx="259" cy="122" r="16" fill="#F2C6A7" />
              <path d="m242 120 17-17 20 9-3 6-19-5-14 12-4-5Z" fill="#111E2D" />
              <path d="M253 104h14v6h-14zM260 105l30-11-30-11-30 11 30 11Zm25-9v17" fill="#101D2D" />
              <path d="M285 112c5 4 8 8 8 13" fill="none" stroke="#FFB547" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="font-display mx-auto max-w-xl text-[25px] font-semibold leading-tight tracking-tight text-white sm:text-3xl lg:text-[38px]">
            Satu Platform untuk Semua Kebutuhan Wisudamu di Jogja!
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-xs leading-5 text-sky-100/75 sm:mt-4 sm:text-sm sm:leading-6">
            Temukan kebutuhan wisuda dari vendor lokal—mulai dari persiapan gaya, penginapan, hingga hadiah spesial.
          </p>
        </div>

        <div className="relative z-10 hidden w-fit items-center gap-2 rounded-xl border border-white/10 bg-[#031D30]/70 px-4 py-3 text-sm text-sky-50 shadow-lg shadow-black/10 sm:flex">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 text-[#FFB547]" fill="currentColor"><path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.5 6.3-.9L12 2.8Z" /></svg>
          <span className="font-semibold">Persiapan wisuda, lebih praktis</span>
        </div>
      </section>

      <section className="flex min-h-[calc(100dvh-2rem)] items-center justify-center px-4 py-8 sm:px-8 lg:min-h-dvh lg:px-10 lg:py-12" aria-label="Masuk ke akun JogjaHub">
        <div className="w-full max-w-[460px] rounded-[26px] border border-[#E8EAF0] bg-white px-5 py-6 shadow-[0_18px_48px_rgba(20,35,55,0.12)] sm:px-9 sm:py-8 lg:px-10 lg:py-9">
          <Link href={ROUTES.home} className="mb-7 inline-flex min-h-10 items-center gap-2 text-xs font-medium text-[#4B5563] transition hover:text-[#121C2A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m14 18-6-6 6-6" /><path d="M8 12h12" /></svg>
            Kembali ke Beranda
          </Link>

          <div role="group" aria-label="Masuk sebagai" className="mb-6 grid grid-cols-2 rounded-xl bg-[#E8EEFF] p-1">
            {(["customer", "tenant"] as const).map((accountRole) => (
              <button
                key={accountRole}
                type="button"
                aria-pressed={role === accountRole}
                onClick={() => { setRole(accountRole); setError(""); setStatusVariant("error"); }}
                className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] ${role === accountRole ? "bg-[#FF6B00] text-[#172235] shadow-sm" : "text-[#454B58] hover:text-[#121C2A]"}`}
              >
                {accountRole === "customer" ? "User" : "Tenant"}
              </button>
            ))}
          </div>

          <div>
            <h2 id="login-title" className="font-display text-[23px] font-semibold tracking-tight text-[#172235] sm:text-[25px]">Selamat Datang di JogjaHub</h2>
            <p className="mt-1 text-[13px] leading-5 text-[#5A6472]">Silakan masuk untuk mengelola paket dan jadwal wisudamu.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate aria-labelledby="login-title">
              <label className="block text-xs font-semibold text-[#273244]" htmlFor="email">Email
                <span className="relative mt-2 block">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4.5 7 7.5 6 7.5-6" /></svg>
                  <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="username@email.com" className="min-h-12 w-full rounded-lg border border-transparent bg-[#F5F7FC] py-3 pl-10 pr-3 text-sm font-normal text-[#172235] outline-none transition placeholder:text-[#9AA3B2] focus:border-[#FF8A38] focus:bg-white focus:ring-2 focus:ring-[#FF6B00]/15" />
                </span>
              </label>
              <label className="block text-xs font-semibold text-[#273244]" htmlFor="password">Kata Sandi
                <span className="relative mt-2 block">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687386]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>
                  <input id="password" name="password" type={isPasswordVisible ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan kata sandi" className="min-h-12 w-full rounded-lg border border-transparent bg-[#F5F7FC] py-3 pl-10 pr-12 text-sm font-normal text-[#172235] outline-none transition placeholder:text-[#9AA3B2] focus:border-[#FF8A38] focus:bg-white focus:ring-2 focus:ring-[#FF6B00]/15" />
                  <button type="button" onClick={() => setIsPasswordVisible((visible) => !visible)} aria-label={isPasswordVisible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} aria-pressed={isPasswordVisible} className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-md text-[#687386] transition hover:text-[#172235] focus-visible:outline-2 focus-visible:outline-[#A04100]">
                    {isPasswordVisible
                      ? <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5.5 0 9 7 9 7a15.4 15.4 0 0 1-3.1 3.9M6.2 6.2C3.9 7.8 3 12 3 12s3.5 7 9 7a10.7 10.7 0 0 0 2.1-.2" /></svg>
                      : <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" /><circle cx="12" cy="12" r="2.5" /></svg>}
                  </button>
                </span>
              </label>

              {error ? <p role={statusVariant === "info" ? "status" : "alert"} className={`text-sm leading-5 ${statusVariant === "info" ? "text-[#8A4B08]" : "text-[#BA1A1A]"}`}>{error}</p> : null}

              <button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#FF6B00] px-4 py-3 text-sm font-semibold text-[#172235] shadow-[0_5px_12px_rgba(255,107,0,0.2)] transition-colors hover:bg-[#E85F00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] disabled:cursor-not-allowed disabled:opacity-65">
                {isSubmitting ? "Memproses..." : "Masuk ke JogjaHub"}
              </button>
            </form>
          </div>

          <p className="mt-7 text-center text-xs leading-5 text-[#606B79]">
            Belum punya akun?{" "}
            <Link href={`${ROUTES.register}?role=${role}`} className="font-semibold text-[#D95000] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
