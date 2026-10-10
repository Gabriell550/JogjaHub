"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
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
      const session = await login({ email: email.trim(), password, role: "admin" });
      if (session.user.role !== "admin") {
        setError("Akun ini bukan akun admin.");
        return;
      }
      router.push("/admin");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login gagal. Periksa kembali email dan kata sandi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FF] px-4">
      <section className="w-full max-w-sm border border-[#D3E2ED] bg-white p-8 shadow-lg" aria-labelledby="admin-login-title">
        <h1 id="admin-login-title" className="font-display text-xl font-semibold text-[#121C2A]">Login Admin</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <label className="block text-sm font-medium text-[#121C2A]" htmlFor="email">Email
            <input id="email" name="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full rounded-md border border-[#8E7164]/50 px-3 text-base" />
          </label>
          <label className="block text-sm font-medium text-[#121C2A]" htmlFor="password">Kata sandi
            <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-12 w-full rounded-md border border-[#8E7164]/50 px-3 text-base" />
          </label>
          {error ? <p role="alert" className="text-sm text-[#BA1A1A]">{error}</p> : null}
          <button type="submit" disabled={isSubmitting} className="min-h-12 w-full rounded-md bg-[#121C2A] font-semibold text-white disabled:opacity-60">{isSubmitting ? "Memproses..." : "Masuk"}</button>
        </form>
      </section>
    </div>
  );
}