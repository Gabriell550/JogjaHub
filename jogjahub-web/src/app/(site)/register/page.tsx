"use client";

import { Suspense, type FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/hooks/useAuth";
import { ROUTES } from "@/src/constants/routes";

type RegisterRole = "customer" | "tenant";
const categories = ["Beauty & Style", "Penginapan", "Gifting"] as const;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerCustomer, registerTenant } = useAuth();
  const [role, setRole] = useState<RegisterRole>(() => searchParams.get("role") === "tenant" ? "tenant" : "customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [address, setAddress] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleCategory(category: string) {
    setSelectedCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!name.trim()) { setError("Nama wajib diisi."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Masukkan alamat email yang valid."); return; }
    if (password.length < 8) { setError("Kata sandi harus terdiri dari minimal 8 karakter."); return; }
    if (password !== passwordConfirmation) { setError("Konfirmasi kata sandi tidak sama."); return; }

    setIsSubmitting(true);
    try {
      if (role === "customer") {
        await registerCustomer({ name: name.trim(), email: email.trim(), password, password_confirmation: passwordConfirmation, phone: phone || undefined });
        router.push(ROUTES.dashboard);
      } else {
        await registerTenant({ name: name.trim(), email: email.trim(), password, password_confirmation: passwordConfirmation, address: address || undefined, phone: phone || undefined, categories: selectedCategories });
        router.push(`${ROUTES.login}?registered=tenant`);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Registrasi gagal. Periksa kembali data yang kamu masukkan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-8">
      <section className="w-full max-w-md border border-[#D3E2ED] bg-white p-6 shadow-lg shadow-[#1E293B]/5 sm:p-9" aria-labelledby="register-title">
        <div className="mb-7 space-y-2 text-center">
          <Link href={ROUTES.home} className="font-display inline-block text-xl font-bold text-[#121C2A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A04100]"><span className="text-[#FF6B00]">Jogja</span>Hub</Link>
          <h1 id="register-title" className="font-display pt-2 text-2xl font-semibold text-[#121C2A]">Daftar di JogjaHub</h1>
          <p className="text-sm text-[#5A4136]">Siapkan kebutuhan wisudamu bersama vendor lokal.</p>
        </div>
        <div role="tablist" aria-label="Pilih jenis akun" className="mb-6 grid grid-cols-2 rounded-lg bg-[#EFF4FF] p-1">
          {(["customer", "tenant"] as const).map((accountRole) => (
            <button key={accountRole} id={`register-tab-${accountRole}`} type="button" role="tab" aria-selected={role === accountRole} aria-controls="register-panel" onClick={() => { setRole(accountRole); setError(""); }} className={`min-h-11 rounded-md px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] ${role === accountRole ? "bg-white text-[#121C2A] shadow-sm" : "text-[#5A4136] hover:text-[#121C2A]"}`}>{accountRole === "customer" ? "Customer" : "Tenant"}</button>
          ))}
        </div>
        <div id="register-panel" role="tabpanel" aria-labelledby={`register-tab-${role}`}>
          <h2 className="font-display mb-5 text-lg font-semibold text-[#121C2A]">Daftar sebagai {role === "customer" ? "Customer" : "Tenant"}</h2>
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <label className="block text-sm font-medium text-[#121C2A]" htmlFor="name">{role === "tenant" ? "Nama Bisnis / Toko" : "Nama lengkap"}
              <input id="name" name="name" type="text" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder={role === "tenant" ? "Nama bisnis/toko kamu" : "Nama kamu"} className="mt-2 min-h-12 w-full rounded-md border border-[#8E7164]/50 bg-white px-3 text-base text-[#121C2A] placeholder:text-[#5A4136]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]" />
            </label>
            <label className="block text-sm font-medium text-[#121C2A]" htmlFor="email">Email
              <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" className="mt-2 min-h-12 w-full rounded-md border border-[#8E7164]/50 bg-white px-3 text-base text-[#121C2A] placeholder:text-[#5A4136]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]" />
            </label>
            <label className="block text-sm font-medium text-[#121C2A]" htmlFor="phone">No. HP <span className="font-normal text-[#5A4136]">(opsional)</span>
              <input id="phone" name="phone" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="08xxxxxxxxxx" className="mt-2 min-h-12 w-full rounded-md border border-[#8E7164]/50 bg-white px-3 text-base text-[#121C2A] placeholder:text-[#5A4136]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]" />
            </label>
            {role === "tenant" ? <>
              <label className="block text-sm font-medium text-[#121C2A]" htmlFor="address">Alamat <span className="font-normal text-[#5A4136]">(opsional)</span>
                <textarea id="address" name="address" rows={3} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Alamat usaha" className="mt-2 w-full rounded-md border border-[#8E7164]/50 bg-white px-3 py-3 text-base text-[#121C2A] placeholder:text-[#5A4136]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]" />
              </label>
              <fieldset><legend className="text-sm font-medium text-[#121C2A]">Kategori layanan <span className="font-normal text-[#5A4136]">(opsional)</span></legend><div className="mt-2 space-y-2">{categories.map((category) => <label key={category} className="flex items-center gap-3 text-sm text-[#5A4136]"><input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => toggleCategory(category)} className="h-4 w-4 accent-[#FF6B00]" />{category}</label>)}</div></fieldset>
+            </> : null}
+            <label className="block text-sm font-medium text-[#121C2A]" htmlFor="password">Kata sandi
+              <input id="password" name="password" type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimal 8 karakter" className="mt-2 min-h-12 w-full rounded-md border border-[#8E7164]/50 bg-white px-3 text-base text-[#121C2A] placeholder:text-[#5A4136]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]" />
+            </label>
+            <label className="block text-sm font-medium text-[#121C2A]" htmlFor="password_confirmation">Konfirmasi kata sandi
+              <input id="password_confirmation" name="password_confirmation" type="password" autoComplete="new-password" required value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} placeholder="Ulangi kata sandi" className="mt-2 min-h-12 w-full rounded-md border border-[#8E7164]/50 bg-white px-3 text-base text-[#121C2A] placeholder:text-[#5A4136]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]" />
+            </label>
            {error ? <p role="alert" className="text-sm leading-6 text-[#BA1A1A]">{error}</p> : null}
            <button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#FF6B00] px-4 py-3 font-semibold text-[#121C2A] transition duration-200 hover:-translate-y-0.5 hover:bg-[#E85F00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] disabled:cursor-not-allowed disabled:opacity-65 motion-reduce:transform-none">{isSubmitting ? "Memproses..." : "Daftar"}</button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm leading-6 text-[#5A4136]">Sudah punya akun?{" "}<Link href={`${ROUTES.login}?role=${role}`} className="font-semibold text-[#A04100] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">Masuk sebagai {role === "customer" ? "Customer" : "Tenant"}</Link></p>
      </section>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={null}><RegisterForm /></Suspense>;
}
