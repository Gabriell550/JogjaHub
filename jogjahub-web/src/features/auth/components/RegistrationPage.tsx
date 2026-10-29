"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/src/constants/routes";
import { useAuth } from "@/src/hooks/useAuth";
import type { RegisterTenantPayload } from "@/src/features/auth/types";

type RegistrationRole = "customer" | "tenant";
type FieldName =
  | "name"
  | "email"
  | "phone"
  | "address"
  | "categories"
  | "location"
  | "password"
  | "passwordConfirmation"
  | "documents";
type FieldErrors = Partial<Record<FieldName, string>>;

const tenantCategories = [
  { value: "salon_mua", label: "Salon & MUA" },
  { value: "butik_wisuda", label: "Butik Busana Wisuda" },
  { value: "penginapan", label: "Penginapan" },
  { value: "selempang_plakat", label: "Selempang & Plakat" },
  { value: "akrilik", label: "Akrilik" },
  { value: "florist", label: "Florist" },
] as const;

function FieldIcon({ name }: { name: "user" | "mail" | "phone" | "lock" | "pin" | "store" }) {
  const paths = {
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.5-3.3 2.8-5 7-5s6.5 1.7 7 5" /></>,
    mail: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    phone: <><path d="M7 3.8h10a1.5 1.5 0 0 1 1.5 1.5v13.4a1.5 1.5 0 0 1-1.5 1.5H7a1.5 1.5 0 0 1-1.5-1.5V5.3A1.5 1.5 0 0 1 7 3.8Z" /><path d="M10 17.5h4" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 4v3" /></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
    store: <><path d="M4 10v10h16V10M3 10l2-6h14l2 6" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-6h6v6" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
      {paths[name]}
    </svg>
  );
}

function GraduationIllustration() {
  return (
    <svg viewBox="0 0 420 300" role="img" aria-labelledby="registration-art-title" className="mx-auto w-full max-w-[380px] drop-shadow-[0_20px_28px_rgba(114,45,0,0.2)]">
      <title id="registration-art-title">Ilustrasi perjalanan wisuda bersama JogjaHub</title>
      <circle cx="210" cy="35" r="18" fill="#FFC24B" />
      <path d="M210 27v63" stroke="#FFF0C2" strokeWidth="7" strokeLinecap="round" />
      <path d="m210 23 5 12h-10l5-12Z" fill="#FFF8E8" />
      <circle cx="74" cy="67" r="4" fill="#FFF1C7" />
      <circle cx="350" cy="75" r="5" fill="#FFD47A" />
      <circle cx="315" cy="119" r="3" fill="#FFF1C7" />
      <path d="M90 105 145 91l44 14-54 15-45-15Z" fill="#062E4A" />
      <path d="m135 118 3 19" stroke="#FFD15C" strokeWidth="3" />
      <path d="M111 194c0-25 16-42 38-42s38 17 38 42v53h-76v-53Z" fill="#082F4A" />
      <circle cx="149" cy="143" r="17" fill="#FFD9BB" />
      <path d="M129 141c1-14 9-22 20-22s19 8 20 22c-12 8-28 8-40 0Z" fill="#182538" />
      <path d="m131 166 18 31 18-31" fill="#FFF8F0" />
      <path d="M235 194c0-25 16-42 38-42s38 17 38 42v53h-76v-53Z" fill="#082F4A" />
      <circle cx="273" cy="143" r="17" fill="#FFD9BB" />
      <path d="M253 141c1-14 9-22 20-22s19 8 20 22c-12 8-28 8-40 0Z" fill="#182538" />
      <path d="m255 166 18 31 18-31" fill="#FFF8F0" />
      <path d="M58 249c60-16 245-16 305 0" fill="none" stroke="#FFF3D2" strokeWidth="3" strokeDasharray="7 7" />
      <path d="M194 204h32m-16-16v32" stroke="#FFD15C" strokeWidth="7" strokeLinecap="round" />
      <path d="m324 157 12 12-22 22-12-12 22-22Z" fill="#FFF3D2" />
      <circle cx="301" cy="191" r="7" fill="#A8D9FF" />
      <circle cx="333" cy="166" r="7" fill="#FFB180" />
    </svg>
  );
}

export function RegistrationPage({ role }: { role: RegistrationRole }) {
  const isTenant = role === "tenant";
  const router = useRouter();
  const { registerCustomer, registerTenant } = useAuth();
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [ktp, setKtp] = useState<File | null>(null);
  const [nib, setNib] = useState<File | null>(null);
  const [portfolio, setPortfolio] = useState<File | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const shouldFocusErrorsRef = useRef(false);

  useEffect(() => {
    if (!shouldFocusErrorsRef.current || (!Object.keys(errors).length && !formError)) return;
    shouldFocusErrorsRef.current = false;
    errorSummaryRef.current?.focus();
  }, [errors, formError]);

  function getFieldError(field: FieldName): string | undefined {
    switch (field) {
      case "name":
        if (!name.trim()) return isTenant ? "Nama bisnis wajib diisi." : "Nama lengkap wajib diisi.";
        if (name.trim().length > 255) return "Nama maksimal 255 karakter.";
        return undefined;
      case "email":
        if (!email.trim()) return "Email wajib diisi.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Masukkan alamat email yang valid.";
        return undefined;
      case "phone":
        if (phone.trim().length > 20) return "Nomor HP maksimal 20 karakter.";
        return undefined;
      case "address":
        if (address.length > 1000) return "Alamat maksimal 1000 karakter.";
        return undefined;
      case "categories":
        return categories.length ? undefined : "Pilih minimal satu kategori layanan.";
      case "location": {
        const lat = Number(latitude);
        const lng = Number(longitude);
        if (!latitude.trim() || !longitude.trim()) return "Pilih atau masukkan koordinat lokasi usaha.";
        if (!Number.isFinite(lat) || lat < -90 || lat > 90) return "Latitude harus berada antara -90 dan 90.";
        if (!Number.isFinite(lng) || lng < -180 || lng > 180) return "Longitude harus berada antara -180 dan 180.";
        return undefined;
      }
      case "password":
        if (password.length < 8) return "Kata sandi harus terdiri dari minimal 8 karakter.";
        return undefined;
      case "passwordConfirmation":
        if (!passwordConfirmation) return "Konfirmasi kata sandi wajib diisi.";
        if (password !== passwordConfirmation) return "Konfirmasi kata sandi tidak sama.";
        return undefined;
      case "documents":
        if (!ktp) return "Unggah KTP pemilik.";
        if (!nib && !portfolio) return "Unggah NIB atau portofolio layanan.";
        if (ktp.size > 2 * 1024 * 1024) return "Ukuran KTP maksimal 2 MB.";
        if (nib && nib.size > 2 * 1024 * 1024) return "Ukuran NIB maksimal 2 MB.";
        if (portfolio && portfolio.size > 5020 * 1024) return "Ukuran portofolio maksimal 5020 KB.";
        return undefined;
      default:
        return undefined;
    }
  }

  function validate(): FieldErrors {
    const fields: FieldName[] = isTenant
      ? ["name", "email", "phone", "address", "categories", "location", "password", "passwordConfirmation", "documents"]
      : ["name", "email", "phone", "password", "passwordConfirmation"];
    return Object.fromEntries(fields.flatMap((field) => {
      const message = getFieldError(field);
      return message ? [[field, message]] : [];
    })) as FieldErrors;
  }

  function validateField(field: FieldName) {
    const message = getFieldError(field);
    setErrors((current) => ({ ...current, [field]: message }));
  }

  function setFieldValue(field: FieldName, update: () => void) {
    update();
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  function useCurrentLocation() {
    setLocationMessage("");
    if (!navigator.geolocation) {
      setLocationMessage("Browser ini tidak mendukung akses lokasi. Masukkan koordinat secara manual.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLatitude(coords.latitude.toFixed(6));
        setLongitude(coords.longitude.toFixed(6));
        setErrors((current) => ({ ...current, location: undefined }));
      },
      () => setLocationMessage("Lokasi tidak dapat diakses. Izinkan akses lokasi atau masukkan koordinat secara manual."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) {
      shouldFocusErrorsRef.current = true;
      return;
    }

    setIsSubmitting(true);
    try {
      if (isTenant) {
        const payload: RegisterTenantPayload = {
          name: name.trim(),
          email: email.trim(),
          password,
          password_confirmation: passwordConfirmation,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          categories,
          latitude: Number(latitude),
          longitude: Number(longitude),
          ktp: ktp ?? undefined,
          nib: nib ?? undefined,
          portfolio: portfolio ?? undefined,
        };
        await registerTenant(payload);
        router.push(`${ROUTES.login}?registered=tenant&role=tenant`);
      } else {
        await registerCustomer({
          name: name.trim(),
          email: email.trim(),
          password,
          password_confirmation: passwordConfirmation,
          phone: phone.trim() || undefined,
        });
        router.push(ROUTES.dashboard);
      }
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : "Registrasi gagal. Periksa kembali data yang kamu masukkan.");
      shouldFocusErrorsRef.current = true;
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldClassName = "mt-2 min-h-12 w-full rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-3 text-base text-[#172235] placeholder:text-[#778394] transition-colors focus-visible:border-[#D95000] focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D95000] aria-[invalid=true]:border-[#BA1A1A]";
  const errorClassName = "mt-1 text-sm leading-5 text-[#BA1A1A]";

  return (
    <main className="grid min-h-dvh bg-white lg:grid-cols-[minmax(350px,0.78fr)_minmax(560px,1.12fr)]">
      <aside className="relative flex min-h-[300px] flex-col overflow-hidden bg-[linear-gradient(150deg,#FF7A00_0%,#F45B00_58%,#C84A0A_100%)] px-6 py-6 text-white sm:px-10 lg:sticky lg:top-0 lg:h-dvh lg:min-h-[680px] lg:px-12 lg:py-9" aria-label="Tentang JogjaHub">
        <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-[#FFB04D]/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#A43A00]/20 blur-3xl" />
        <Link href={ROUTES.home} className="relative z-10 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-white/15 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="m15 18-6-6 6-6M9 12h12" /></svg>
          Kembali ke Beranda
        </Link>

        <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-5 text-center lg:py-8">
          <div className="mx-auto mb-2 w-full max-w-[330px] sm:max-w-[380px] lg:mb-5">
            <GraduationIllustration />
          </div>
          <h1 className="font-display mx-auto max-w-[520px] text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-[34px]">
            {isTenant
              ? "Kembangkan Bisnismu Bersama JogjaHub!"
              : "Mulai Perjalanan Kebutuhan Wisudamu Bersama JogjaHub!"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/90 sm:text-base">
            {isTenant
              ? "Jangkau lebih banyak pelanggan dan kembangkan layanan wisuda lokalmu."
              : "Temukan toga, MUA, kebaya, studio foto, dan kebutuhan wisuda terpercaya di Yogyakarta."}
          </p>
        </div>
        <p className="relative z-10 hidden text-center text-xs text-white/75 lg:block">Platform layanan wisuda lokal terpercaya di Yogyakarta</p>
      </aside>

      <section className="flex min-w-0 justify-center px-5 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-14" aria-labelledby="register-title">
        <div className="w-full max-w-[560px]">
          <Link href={ROUTES.home} className="font-display inline-flex text-lg font-bold tracking-tight text-[#172235] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D95000]">
            <span className="text-[#F06400]">Jogja</span>Hub
          </Link>
          <div className="mt-7">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#A64A10]">{isTenant ? "Pendaftaran Tenant" : "Pendaftaran Customer"}</p>
            <h2 id="register-title" className="font-display mt-2 text-3xl font-bold tracking-tight text-[#172235] sm:text-[34px]">Buat Akun Baru</h2>
            <p className="mt-2 text-sm leading-6 text-[#5D6878]">
              {isTenant
                ? "Daftarkan bisnis dan layananmu untuk bergabung bersama JogjaHub."
                : "Bergabung bersama ribuan mahasiswa yang menyiapkan wisuda di Yogyakarta."}
            </p>
          </div>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
            {Object.keys(errors).length > 0 || formError ? (
              <div ref={errorSummaryRef} tabIndex={-1} role="alert" aria-labelledby="register-error-title" className="rounded-md border border-[#F2B8B5] bg-[#FFF4F2] p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BA1A1A]">
                <h3 id="register-error-title" className="font-semibold text-[#8F1D18]">{formError ? "Registrasi belum berhasil" : "Periksa kembali data berikut"}</h3>
                {formError ? <p className="mt-1 text-sm leading-5 text-[#8F1D18]">{formError}</p> : (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#8F1D18]">
                    {Object.entries(errors).filter((entry): entry is [FieldName, string] => Boolean(entry[1])).map(([field, message]) => (
                      <li key={field}><a href={`#${field}`} className="underline underline-offset-2">{message}</a></li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            <label htmlFor="name" className="block text-sm font-semibold text-[#293548]">
              <span>{isTenant ? "Nama Bisnis / Toko" : "Nama Lengkap"}</span>
              <span className="relative mt-2 block">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#657184]"><FieldIcon name={isTenant ? "store" : "user"} /></span>
                <input id="name" name="name" type="text" autoComplete={isTenant ? "organization" : "name"} required maxLength={255} value={name} onChange={(event) => setFieldValue("name", () => setName(event.target.value))} onBlur={() => validateField("name")} placeholder={isTenant ? "Nama bisnis atau toko" : "Contoh: Sarah Maharani"} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} className={`${fieldClassName} pl-11`} />
              </span>
              {errors.name ? <span id="name-error" className={errorClassName}>{errors.name}</span> : null}
            </label>

            {isTenant ? (
              <>
                <fieldset id="categories" className="min-w-0" aria-describedby={errors.categories ? "categories-error" : undefined}>
                  <legend className="text-sm font-semibold text-[#293548]">Kategori Layanan <span className="font-normal text-[#667085]">(pilih minimal satu)</span></legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tenantCategories.map((category) => (
                      <label key={category.value} className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#D95000] ${categories.includes(category.value) ? "border-[#D95000] bg-[#FFF1E8] text-[#873C0D]" : "border-[#CBD5E1] bg-white text-[#465264] hover:border-[#D95000]"}`}>
                        <input type="checkbox" name="categories" value={category.value} checked={categories.includes(category.value)} onChange={(event) => {
                          setCategories((current) => event.target.checked ? [...current, category.value] : current.filter((value) => value !== category.value));
                          setErrors((current) => ({ ...current, categories: undefined }));
                        }} className="h-4 w-4 accent-[#D95000]" />
                        {category.label}
                      </label>
                    ))}
                  </div>
                  {errors.categories ? <p id="categories-error" className={errorClassName}>{errors.categories}</p> : null}
                </fieldset>

                <label htmlFor="address" className="block text-sm font-semibold text-[#293548]">
                  Alamat <span className="font-normal text-[#667085]">(opsional)</span>
                  <textarea id="address" name="address" rows={3} maxLength={1000} value={address} onChange={(event) => setFieldValue("address", () => setAddress(event.target.value))} onBlur={() => validateField("address")} placeholder="Contoh: Jl. Kaliurang KM 5..." aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? "address-error" : undefined} className={`${fieldClassName} min-h-24 py-3`} />
                  {errors.address ? <span id="address-error" className={errorClassName}>{errors.address}</span> : null}
                </label>

                <fieldset id="location" className="min-w-0" aria-describedby={errors.location ? "location-error" : "location-help"}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <legend className="text-sm font-semibold text-[#293548]">Titik Lokasi Usaha</legend>
                    <button type="button" onClick={useCurrentLocation} className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-[#A04100] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D95000]">
                      <FieldIcon name="pin" /> Gunakan lokasi saat ini
                    </button>
                  </div>
                  <p id="location-help" className="mt-1 text-xs leading-5 text-[#667085]">Izinkan browser mengambil lokasi usaha atau masukkan koordinat secara manual.</p>
                  {locationMessage ? <p role="status" className="mt-1 text-sm text-[#8A4B08]">{locationMessage}</p> : null}
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <label htmlFor="latitude" className="text-xs font-medium text-[#4B5565]">Latitude
                      <input id="latitude" name="latitude" type="number" step="any" min="-90" max="90" value={latitude} onChange={(event) => setFieldValue("location", () => setLatitude(event.target.value))} onBlur={() => validateField("location")} placeholder="-7.795600" aria-invalid={Boolean(errors.location)} aria-describedby={errors.location ? "location-error" : "location-help"} className={`${fieldClassName} min-h-11 text-sm`} />
                    </label>
                    <label htmlFor="longitude" className="text-xs font-medium text-[#4B5565]">Longitude
                      <input id="longitude" name="longitude" type="number" step="any" min="-180" max="180" value={longitude} onChange={(event) => setFieldValue("location", () => setLongitude(event.target.value))} onBlur={() => validateField("location")} placeholder="110.369500" aria-invalid={Boolean(errors.location)} aria-describedby={errors.location ? "location-error" : "location-help"} className={`${fieldClassName} min-h-11 text-sm`} />
                    </label>
                  </div>
                  {errors.location ? <p id="location-error" className={errorClassName}>{errors.location}</p> : null}
                </fieldset>
              </>
            ) : null}

            <label htmlFor="email" className="block text-sm font-semibold text-[#293548]">
              Email
              <span className="relative mt-2 block">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#657184]"><FieldIcon name="mail" /></span>
                <input id="email" name="email" type="email" inputMode="email" autoCapitalize="none" autoComplete="email" required maxLength={255} value={email} onChange={(event) => setFieldValue("email", () => setEmail(event.target.value))} onBlur={() => validateField("email")} placeholder="nama@email.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} className={`${fieldClassName} pl-11`} />
              </span>
              {errors.email ? <span id="email-error" className={errorClassName}>{errors.email}</span> : null}
            </label>

            <label htmlFor="phone" className="block text-sm font-semibold text-[#293548]">
              {isTenant ? "Nomor Telepon / WhatsApp" : "Nomor HP"}
              <span className="font-normal text-[#667085]"> (opsional)</span>
              <span className="relative mt-2 block">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#657184]"><FieldIcon name="phone" /></span>
                <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} value={phone} onChange={(event) => setFieldValue("phone", () => setPhone(event.target.value))} onBlur={() => validateField("phone")} placeholder="08xxxxxxxxxx" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "phone-error" : undefined} className={`${fieldClassName} pl-11`} />
              </span>
              {errors.phone ? <span id="phone-error" className={errorClassName}>{errors.phone}</span> : null}
            </label>

            <label htmlFor="password" className="block text-sm font-semibold text-[#293548]">
              Password
              <span className="relative mt-2 block">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#657184]"><FieldIcon name="lock" /></span>
                <input id="password" name="password" type={passwordVisible ? "text" : "password"} autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setFieldValue("password", () => setPassword(event.target.value))} onBlur={() => validateField("password")} placeholder="Minimal 8 karakter" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "password-error" : "password-help"} className={`${fieldClassName} pl-11 pr-14`} />
                <button type="button" aria-label={passwordVisible ? "Sembunyikan password" : "Tampilkan password"} aria-pressed={passwordVisible} onClick={() => setPasswordVisible((visible) => !visible)} className="absolute inset-y-0 right-1 my-1 grid min-h-10 w-11 place-items-center rounded text-[#657184] hover:bg-[#E9EDF3] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#D95000]">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg>
                </button>
              </span>
              {errors.password ? <span id="password-error" className={errorClassName}>{errors.password}</span> : <span id="password-help" className="mt-1 block text-xs text-[#667085]">Minimal 8 karakter</span>}
            </label>

            <label htmlFor="passwordConfirmation" className="block text-sm font-semibold text-[#293548]">
              Konfirmasi Password
              <span className="relative mt-2 block">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#657184]"><FieldIcon name="lock" /></span>
                <input id="passwordConfirmation" name="password_confirmation" type={passwordVisible ? "text" : "password"} autoComplete="new-password" required value={passwordConfirmation} onChange={(event) => setFieldValue("passwordConfirmation", () => setPasswordConfirmation(event.target.value))} onBlur={() => validateField("passwordConfirmation")} placeholder="Ulangi password" aria-invalid={Boolean(errors.passwordConfirmation)} aria-describedby={errors.passwordConfirmation ? "password-confirmation-error" : undefined} className={`${fieldClassName} pl-11`} />
              </span>
              {errors.passwordConfirmation ? <span id="password-confirmation-error" className={errorClassName}>{errors.passwordConfirmation}</span> : null}
            </label>

            {isTenant ? (
              <fieldset id="documents" aria-describedby={errors.documents ? "documents-error" : "documents-help"} className="rounded-lg border border-[#E1E7EF] bg-[#FCFCFD] p-4">
                <legend className="px-1 text-sm font-semibold text-[#293548]">Dokumen Verifikasi</legend>
                <p id="documents-help" className="text-xs leading-5 text-[#667085]">Format PDF/JPG/PNG. Wajib unggah KTP dan salah satu dari NIB atau portofolio.</p>
                <div className="mt-3 space-y-3">
                  <label htmlFor="ktp" className="block text-sm font-medium text-[#465264]">KTP Pemilik <span className="text-[#BA1A1A]">*</span>
                    <input id="ktp" name="ktp" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={(event) => {
                      setKtp(event.target.files?.[0] ?? null);
                      setErrors((current) => ({ ...current, documents: undefined }));
                    }} className="mt-2 block min-h-11 w-full rounded-md border border-[#CBD5E1] bg-white text-sm text-[#465264] file:mr-3 file:min-h-11 file:border-0 file:bg-[#FFF1E8] file:px-3 file:font-semibold file:text-[#873C0D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D95000]" />
                  </label>
                  <label htmlFor="nib" className="block text-sm font-medium text-[#465264]">NIB <span className="font-normal text-[#667085]">(opsional jika mengunggah portofolio)</span>
                    <input id="nib" name="nib" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={(event) => {
                      setNib(event.target.files?.[0] ?? null);
                      setErrors((current) => ({ ...current, documents: undefined }));
                    }} className="mt-2 block min-h-11 w-full rounded-md border border-[#CBD5E1] bg-white text-sm text-[#465264] file:mr-3 file:min-h-11 file:border-0 file:bg-[#FFF1E8] file:px-3 file:font-semibold file:text-[#873C0D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D95000]" />
                  </label>
                  <label htmlFor="portfolio" className="block text-sm font-medium text-[#465264]">Portofolio Layanan <span className="font-normal text-[#667085]">(opsional jika mengunggah NIB)</span>
                    <input id="portfolio" name="portfolio" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={(event) => {
                      setPortfolio(event.target.files?.[0] ?? null);
                      setErrors((current) => ({ ...current, documents: undefined }));
                    }} className="mt-2 block min-h-11 w-full rounded-md border border-[#CBD5E1] bg-white text-sm text-[#465264] file:mr-3 file:min-h-11 file:border-0 file:bg-[#FFF1E8] file:px-3 file:font-semibold file:text-[#873C0D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D95000]" />
                  </label>
                </div>
                {errors.documents ? <p id="documents-error" className={errorClassName}>{errors.documents}</p> : null}
              </fieldset>
            ) : null}

            <button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#062D49] px-4 py-3 font-semibold text-white shadow-[0_5px_12px_rgba(5,45,73,0.16)] transition-colors hover:bg-[#0A4266] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F06400] disabled:cursor-not-allowed disabled:opacity-65">
              {isSubmitting ? (
                <>
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 animate-spin fill-none stroke-current" strokeWidth="3"><circle cx="12" cy="12" r="9" strokeOpacity=".25" /><path d="M21 12a9 9 0 0 0-9-9" /></svg>
                  Memproses...
                </>
              ) : "Daftar Sekarang"}
            </button>
          </form>

          <p className="mt-7 border-t border-[#E8EDF3] pt-5 text-sm leading-6 text-[#5D6878]">
            Sudah punya akun?{" "}
            <Link href={`${ROUTES.login}?role=${role}`} className="font-semibold text-[#A04100] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D95000]">Masuk di sini</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
