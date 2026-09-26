"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/src/lib/api";
import { setAuthToken } from "@/src/lib/auth";
import { ROUTES } from "@/src/constants/routes";
import Link from "next/link";

type LoginRole = "customer" | "tenant";

type LoginResponse = {
  token?: string;
  data?: {
    token?: string;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<LoginRole>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

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
      const response = await apiPost<LoginResponse>("/auth/login", {
        email: email.trim(),
        password,
        role,
      });
      const token = response.data?.token ?? response.token;

      if (!token) {
        throw new Error("Token login tidak ditemukan. Silakan coba lagi.");
      }

      setAuthToken(token);
      router.push(role === "customer" ? ROUTES.dashboard : ROUTES.vendor);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login gagal. Periksa kembali data akunmu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-8">
      <section className="w-full max-w-md border border-[#D3E2ED] bg-white p-6 shadow-lg shadow-[#1E293B]/5 sm:p-9" aria-labelledby="login-title">
        <div className="mb-7 space-y-2 text-center">
          <Link href={ROUTES.home} className="font-display inline-block text-xl font-bold text-[#121C2A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A04100]">
            <span className="text-[#FF6B00]">Jogja</span>Hub
          </Link>
          <h1 id="login-title" className="font-display pt-2 text-2xl font-semibold text-[#121C2A]">Masuk ke JogjaHub</h1>
          <p className="text-sm text-[#5A4136]">Lanjutkan persiapan wisudamu.</p>
        </div>

        <div role="tablist" aria-label="Pilih jenis akun" className="mb-6 grid grid-cols-2 rounded-lg bg-[#EFF4FF] p-1">
          {(["customer", "tenant"] as const).map((accountRole) => (
            <button
              key={accountRole}
              id={`tab-${accountRole}`}
              type="button"
              role="tab"
              aria-selected={role === accountRole}
              aria-controls="login-panel"
              onClick={() => { setRole(accountRole); setError(""); }}
              className={`min-h-11 rounded-md px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] ${role === accountRole ? "bg-white text-[#121C2A] shadow-sm" : "text-[#5A4136] hover:text-[#121C2A]"}`}
            >
              {accountRole === "customer" ? "Customer" : "Tenant"}
            </button>
          ))}
        </div>

        <div id="login-panel" role="tabpanel" aria-labelledby={`tab-${role}`}>
          <h2 className="font-display mb-5 text-lg font-semibold text-[#121C2A]">
            Masuk sebagai {role === "customer" ? "Customer" : "Tenant"}
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <label className="block text-sm font-medium text-[#121C2A]" htmlFor="email">
              Email
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                aria-invalid={Boolean(error && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))}
                className="mt-2 min-h-12 w-full rounded-md border border-[#8E7164]/50 bg-white px-3 text-base text-[#121C2A] placeholder:text-[#5A4136]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]"
              />
            </label>
            <label className="block text-sm font-medium text-[#121C2A]" htmlFor="password">
              Kata sandi
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan kata sandi"
                aria-invalid={Boolean(error && password.length < 6)}
                className="mt-2 min-h-12 w-full rounded-md border border-[#8E7164]/50 bg-white px-3 text-base text-[#121C2A] placeholder:text-[#5A4136]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]"
              />
            </label>
            {error ? <p role="alert" className="text-sm leading-6 text-[#BA1A1A]">{error}</p> : null}
            <button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#FF6B00] px-4 py-3 font-semibold text-[#121C2A] transition duration-200 hover:-translate-y-0.5 hover:bg-[#E85F00] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A04100] disabled:cursor-not-allowed disabled:opacity-65 motion-reduce:transform-none">
              {isSubmitting ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm leading-6 text-[#5A4136]">
          Belum punya akun?{" "}
          <Link href={`${ROUTES.register}?role=${role}`} className="font-semibold text-[#A04100] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">
            Daftar sebagai {role === "customer" ? "Customer" : "Tenant"}
          </Link>
        </p>
      </section>
    </div>
  );
}
