"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { CUSTOMER_THEMES, useCustomerTheme, type CustomerTheme } from "@/src/components/customer/CustomerThemeProvider";
import { useAuth } from "@/src/hooks/useAuth";
import { apiGet, apiPost } from "@/src/lib/api";
import { resolveAvatarUrl } from "@/src/lib/avatar";
import type { AuthUser } from "@/src/features/auth/types";

interface CustomerProfileResponse {
  success: boolean;
  data: AuthUser;
}

interface CustomerProfileUpdateResponse extends CustomerProfileResponse {
  message: string;
}

interface ProfileErrors {
  name?: string;
  phone?: string;
  avatar?: string;
}

function getErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const status = message.match(/(?:Request failed: |Permintaan gagal \()(\d{3})/);

  if (status) {
    const messages: Record<string, string> = {
      "401": "Sesi login tidak valid atau sudah berakhir. Silakan login kembali.",
      "403": "Akun ini tidak memiliki akses ke profil customer.",
      "404": "Endpoint profil tidak ditemukan. Periksa konfigurasi API backend.",
      "500": "Server sedang mengalami gangguan. Coba lagi beberapa saat.",
    };
    return messages[status[1]] ?? `Permintaan gagal (${status[1]}). Silakan coba lagi.`;
  }

  return message || "Terjadi kesalahan. Silakan coba lagi.";
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase() ?? "")
    .join("") || "J";
}

export default function CustomerProfilePage() {
  const { session, updateUser } = useAuth();
  const { theme, setTheme, isHydrated: isThemeHydrated, storageError } = useCustomerTheme();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarLoadErrorUrl, setAvatarLoadErrorUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draftTheme, setDraftTheme] = useState<CustomerTheme | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const customerUserId = session?.user.role === "customer" ? session.user.id : null;

  useEffect(() => {
    if (customerUserId === null) return;

    const controller = new AbortController();
    let active = true;

    apiGet<CustomerProfileResponse>("/customer/profile", controller.signal)
      .then((response) => {
        if (!response.success) throw new Error("Profil tidak dapat dimuat.");
        if (!active) return;
        setProfile(response.data);
        setName(response.data.name);
        setPhone(response.data.phone ?? "");
        updateUser(response.data);
      })
      .catch((error: unknown) => {
        if (active && !controller.signal.aborted) setLoadError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setIsProfileLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [customerUserId, reloadKey, updateUser]);

  useEffect(() => {
    if (!avatarPreview) return;
    return () => URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  let profileAvatarUrl: string | null = null;
  let avatarUrlResolutionFailed = false;
  try {
    profileAvatarUrl = resolveAvatarUrl(profile?.avatar_url);
  } catch {
    avatarUrlResolutionFailed = Boolean(profile?.avatar_url);
  }
  const avatarUrl = avatarPreview ?? profileAvatarUrl;
  const avatarLoadFailed = Boolean(avatarUrl && avatarLoadErrorUrl === avatarUrl);
  const showAvatarImage = Boolean(avatarUrl && !avatarLoadFailed);
  const selectedTheme = draftTheme ?? theme;

  if (!session || session.user.role !== "customer") return null;

  const beginEditing = () => {
    if (!profile) return;
    setName(profile.name);
    setPhone(profile.phone ?? "");
    setSelectedAvatar(null);
    setAvatarPreview(null);
    setErrors({});
    setFormError(null);
    setNotice(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setName(profile?.name ?? "");
    setPhone(profile?.phone ?? "");
    setSelectedAvatar(null);
    setAvatarPreview(null);
    setErrors({});
    setFormError(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const validateName = (value: string) => {
    if (!value.trim()) return "Nama wajib diisi.";
    if (value.trim().length > 255) return "Nama maksimal 255 karakter.";
    return undefined;
  };

  const validatePhone = (value: string) => {
    if (profile?.phone && !value.trim()) {
      return "Nomor telepon yang terdaftar tidak dapat dikosongkan melalui formulir ini.";
    }
    if (value.length > 20) return "Nomor telepon maksimal 20 karakter.";
    return undefined;
  };

  const handleAvatarSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    let error: string | undefined;
    if (!file.type.startsWith("image/")) {
      error = "Pilih file gambar dengan format yang didukung.";
    } else if (file.size > 2 * 1024 * 1024) {
      error = "Ukuran foto maksimal 2 MB.";
    }

    setErrors((current) => ({ ...current, avatar: error }));
    setFormError(null);
    if (error) {
      event.currentTarget.value = "";
      return;
    }
    setSelectedAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
    event.currentTarget.value = "";
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;

    setNotice(null);
    setFormError(null);
    const nextErrors: ProfileErrors = {
      name: validateName(name),
      phone: validatePhone(phone),
      avatar: errors.avatar,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      errorSummaryRef.current?.focus();
      return;
    }

    const payload = new FormData();
    const normalizedName = name.trim();
    const normalizedPhone = phone.trim();
    if (normalizedName !== profile.name) payload.append("name", normalizedName);
    if (normalizedPhone !== (profile.phone ?? "")) payload.append("phone", normalizedPhone);
    if (selectedAvatar) payload.append("avatar", selectedAvatar);

    if (!payload.has("name") && !payload.has("phone") && !payload.has("avatar")) {
      setNotice("Tidak ada perubahan untuk disimpan.");
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiPost<CustomerProfileUpdateResponse>("/customer/profile", payload);
      if (!response.success) throw new Error(response.message || "Profil gagal diperbarui.");
      setProfile(response.data);
      setName(response.data.name);
      setPhone(response.data.phone ?? "");
      updateUser(response.data);
      setSelectedAvatar(null);
      setAvatarPreview(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      setIsEditing(false);
      setErrors({});
      setNotice("Profil berhasil diperbarui.");
    } catch (error: unknown) {
      setSelectedAvatar(null);
      setAvatarPreview(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      setFormError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const errorEntries = Object.entries(errors).filter((entry): entry is [keyof ProfileErrors, string] => Boolean(entry[1]));
  return (
    <section className="space-y-7 px-4 py-8 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--customer-primary)]">Akun customer</p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-[var(--customer-text)] sm:text-4xl">Profil saya</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--customer-muted)] sm:text-base">
          Kelola identitas dan tampilan akun JogjaHub sesuai preferensimu.
        </p>
      </header>

      {notice ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">{notice}</p> : null}
      {formError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{formError}</p> : null}

      {isProfileLoading ? (
        <div role="status" className="max-w-4xl rounded-3xl border border-[var(--customer-border)] bg-[var(--customer-surface)] p-6 text-sm font-medium text-[var(--customer-muted)] shadow-sm">
          Memuat profil...
        </div>
      ) : loadError ? (
        <div role="alert" className="max-w-4xl rounded-3xl border border-red-200 bg-[var(--customer-surface)] p-6 shadow-sm">
          <p className="font-semibold text-red-800">Profil belum dapat dimuat</p>
          <p className="mt-1 text-sm text-[var(--customer-muted)]">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setIsProfileLoading(true);
              setLoadError(null);
              setReloadKey((key) => key + 1);
            }}
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[var(--customer-primary)] px-4 text-sm font-bold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--customer-primary)]"
          >
            Coba lagi
          </button>
        </div>
      ) : profile ? (
        <div className="grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(17rem,0.7fr)]">
          <section aria-labelledby="profile-details-title" className="overflow-hidden rounded-3xl border border-[var(--customer-border)] bg-[var(--customer-surface)] shadow-sm">
            <div className="flex flex-col gap-5 border-b border-[var(--customer-border)] bg-[var(--customer-primary-soft)]/60 p-5 sm:flex-row sm:items-center sm:p-7">
              <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-[var(--customer-surface)] bg-[var(--customer-primary-soft)] text-2xl font-bold text-[var(--customer-primary)] shadow-sm">
                {!showAvatarImage ? (
                  <span aria-label={`Avatar ${profile.name}`} role="img">{getInitials(profile.name)}</span>
                ) : null}
                {showAvatarImage ? (
                  <Image
                    key={avatarUrl}
                    src={avatarUrl!}
                    alt={`Foto profil ${profile.name}`}
                    width={96}
                    height={96}
                    unoptimized
                    onError={() => setAvatarLoadErrorUrl(avatarUrl)}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--customer-primary)]">Akun JogjaHub</p>
                <h2 className="font-display mt-1 break-words text-2xl font-bold text-[var(--customer-text)]">{profile.name}</h2>
                <p className="mt-1 break-all text-sm text-[var(--customer-muted)]">{profile.email}</p>
                {avatarUrlResolutionFailed ? (
                  <p role="status" className="mt-2 text-xs font-medium text-amber-800">URL foto profil dari server tidak valid.</p>
                ) : avatarLoadFailed ? (
                  <p role="status" className="mt-2 text-xs font-medium text-amber-800">Foto profil gagal dimuat. Periksa host, port, dan akses storage Laravel.</p>
                ) : null}
              </div>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={beginEditing}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--customer-primary)] px-4 text-sm font-bold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--customer-primary)]"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
                  </svg>
                  Edit profil
                </button>
              ) : null}
            </div>

            {isEditing ? (
              <form noValidate onSubmit={handleSave} className="space-y-6 p-5 sm:p-7">
                {errorEntries.length ? (
                  <div ref={errorSummaryRef} tabIndex={-1} role="alert" aria-labelledby="profile-error-title" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 focus:outline-2 focus:outline-offset-2 focus:outline-red-600">
                    <h3 id="profile-error-title" className="font-bold">Periksa kembali data profil</h3>
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      {errorEntries.map(([field, message]) => (
                        <li key={field}><a className="underline underline-offset-2" href={`#profile-${field}`}>{message}</a></li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="profile-name" className="mb-1.5 block text-sm font-semibold text-[var(--customer-text)]">Nama lengkap</label>
                    <input
                      id="profile-name"
                      autoComplete="name"
                      maxLength={255}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      onBlur={() => setErrors((current) => ({ ...current, name: validateName(name) }))}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "profile-name-error" : undefined}
                      className="min-h-12 w-full rounded-xl border border-[var(--customer-border)] bg-[var(--customer-surface)] px-4 text-sm text-[var(--customer-text)] outline-none transition focus:border-[var(--customer-primary)] focus:ring-2 focus:ring-[var(--customer-primary)]/20"
                    />
                    {errors.name ? <p id="profile-name-error" className="mt-1.5 text-sm text-red-700">{errors.name}</p> : null}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="profile-email" className="mb-1.5 block text-sm font-semibold text-[var(--customer-text)]">Email</label>
                    <input
                      id="profile-email"
                      type="email"
                      value={profile.email}
                      readOnly
                      aria-describedby="profile-email-help"
                      className="min-h-12 w-full rounded-xl border border-[var(--customer-border)] bg-[#F4F6FA] px-4 text-sm text-[var(--customer-muted)]"
                    />
                    <p id="profile-email-help" className="mt-1.5 text-xs text-[var(--customer-muted)]">Email tidak dapat diubah karena API profil saat ini tidak mendukung perubahan email.</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="profile-phone" className="mb-1.5 block text-sm font-semibold text-[var(--customer-text)]">Nomor telepon <span className="font-normal text-[var(--customer-muted)]">(opsional)</span></label>
                    <input
                      id="profile-phone"
                      type="tel"
                      autoComplete="tel"
                      maxLength={20}
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      onBlur={() => setErrors((current) => ({ ...current, phone: validatePhone(phone) }))}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? "profile-phone-error" : "profile-phone-help"}
                      className="min-h-12 w-full rounded-xl border border-[var(--customer-border)] bg-[var(--customer-surface)] px-4 text-sm text-[var(--customer-text)] outline-none transition focus:border-[var(--customer-primary)] focus:ring-2 focus:ring-[var(--customer-primary)]/20"
                    />
                    {errors.phone
                      ? <p id="profile-phone-error" className="mt-1.5 text-sm text-red-700">{errors.phone}</p>
                      : <p id="profile-phone-help" className="mt-1.5 text-xs text-[var(--customer-muted)]">Maksimal 20 karakter.</p>}
                  </div>
                </div>

                <div className="border-t border-[var(--customer-border)] pt-5">
                  <h3 className="text-sm font-bold text-[var(--customer-text)]">Foto profil</h3>
                  <p className="mt-1 text-sm text-[var(--customer-muted)]">Pilih foto JPG, PNG, atau format gambar lain, maksimal 2 MB.</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <input
                      ref={avatarInputRef}
                      id="profile-avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarSelection}
                      aria-invalid={Boolean(errors.avatar)}
                      aria-describedby={errors.avatar ? "profile-avatar-error" : undefined}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor="profile-avatar"
                      className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-[var(--customer-border)] px-4 text-sm font-bold text-[var(--customer-primary)] transition hover:bg-[var(--customer-primary-soft)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--customer-primary)]"
                    >
                      {selectedAvatar ? "Pilih foto lain" : profile.avatar_url ? "Ganti foto" : "Tambah foto"}
                    </label>
                    {selectedAvatar ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(null);
                          setErrors((current) => ({ ...current, avatar: undefined }));
                          if (avatarInputRef.current) avatarInputRef.current.value = "";
                        }}
                        className="min-h-11 rounded-xl px-3 text-sm font-semibold text-[var(--customer-muted)] underline underline-offset-2 hover:text-[var(--customer-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--customer-primary)]"
                      >
                        Batalkan foto
                      </button>
                    ) : null}
                  </div>
                  {errors.avatar ? <p id="profile-avatar-error" className="mt-2 text-sm text-red-700">{errors.avatar}</p> : null}
                  {selectedAvatar ? <p className="mt-2 break-all text-xs text-[var(--customer-muted)]">Pratinjau: {selectedAvatar.name}</p> : null}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-[var(--customer-border)] pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={isSaving}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--customer-border)] px-5 text-sm font-bold text-[var(--customer-text)] transition hover:bg-[#F4F6FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--customer-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--customer-primary)] px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--customer-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Menyimpan...
                      </>
                    ) : "Simpan perubahan"}
                  </button>
                </div>
              </form>
            ) : (
              <dl className="divide-y divide-[var(--customer-border)] px-5 sm:px-7">
                <div className="grid gap-1 py-5 sm:grid-cols-[10rem_1fr] sm:gap-4">
                  <dt className="text-sm font-medium text-[var(--customer-muted)]">Nama</dt>
                  <dd className="break-words text-sm font-semibold text-[var(--customer-text)]">{profile.name}</dd>
                </div>
                <div className="grid gap-1 py-5 sm:grid-cols-[10rem_1fr] sm:gap-4">
                  <dt className="text-sm font-medium text-[var(--customer-muted)]">Email</dt>
                  <dd className="break-all text-sm font-semibold text-[var(--customer-text)]">{profile.email}</dd>
                </div>
                <div className="grid gap-1 py-5 sm:grid-cols-[10rem_1fr] sm:gap-4">
                  <dt className="text-sm font-medium text-[var(--customer-muted)]">Nomor telepon</dt>
                  <dd className="text-sm font-semibold text-[var(--customer-text)]">{profile.phone || "Belum diisi"}</dd>
                </div>
              </dl>
            )}
          </section>

          <section aria-labelledby="appearance-title" className="h-fit rounded-3xl border border-[var(--customer-border)] bg-[var(--customer-surface)] p-5 shadow-sm sm:p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--customer-primary-soft)] text-[var(--customer-primary)]">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a9 9 0 1 0 0 18h1.3a2 2 0 0 0 1.5-3.3 1.7 1.7 0 0 1 1.3-2.8H18a3 3 0 0 0 3-3c0-5-4-8.9-9-8.9Z" />
                <path d="M7.5 12h.01M10 7.5h.01M15 8.5h.01" />
              </svg>
            </div>
            <h2 id="appearance-title" className="font-display mt-4 text-xl font-bold text-[var(--customer-text)]">Tampilan</h2>
            <p className="mt-1 text-sm leading-5 text-[var(--customer-muted)]">Pilih warna yang nyaman. Tema diterapkan pada navigasi dan halaman customer.</p>

            <fieldset className="mt-5 space-y-3">
              <legend className="mb-2 text-sm font-semibold text-[var(--customer-text)]">Tema warna</legend>
              {(Object.entries(CUSTOMER_THEMES) as [CustomerTheme, (typeof CUSTOMER_THEMES)[CustomerTheme]][]).map(([themeId, option]) => {
                const colors = option.colors;
                const selected = selectedTheme === themeId;
                return (
                  <label
                    key={themeId}
                    className={`block cursor-pointer rounded-2xl border p-3 transition focus-within:ring-2 focus-within:ring-[var(--customer-primary)] ${
                      selected ? "border-[var(--customer-primary)] bg-[var(--customer-primary-soft)]/50" : "border-[var(--customer-border)] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="customer-theme"
                      value={themeId}
                      checked={selected}
                      onChange={() => setDraftTheme(themeId)}
                      className="sr-only"
                    />
                    <span className="flex items-center justify-between gap-3">
                      <span>
                        <span className="block text-sm font-bold text-[var(--customer-text)]">{option.label}</span>
                        <span className="mt-0.5 block text-xs text-[var(--customer-muted)]">{option.description}</span>
                      </span>
                      <span aria-hidden="true" className="flex shrink-0 gap-1.5">
                        {[colors.primary, colors.accent, colors.background].map((color) => (
                          <span key={color} className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                        ))}
                      </span>
                    </span>
                    <span aria-hidden="true" className="mt-3 flex h-9 items-center gap-2 rounded-lg border px-2" style={{ backgroundColor: colors.background, borderColor: colors.border }}>
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: colors.accent }} />
                      <span className="h-2 w-14 rounded-full" style={{ backgroundColor: colors.primary, opacity: 0.8 }} />
                      <span className="ml-auto rounded-md px-2 py-1 text-[10px] font-bold text-white" style={{ backgroundColor: colors.primary }}>Contoh</span>
                    </span>
                  </label>
                );
              })}
            </fieldset>

            {storageError ? <p role="alert" className="mt-4 text-sm text-amber-800">{storageError}</p> : null}
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={!isThemeHydrated || selectedTheme === theme}
                onClick={() => {
                  setTheme(selectedTheme);
                  setDraftTheme(null);
                  setNotice(`Tema ${CUSTOMER_THEMES[selectedTheme].label} diterapkan.`);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--customer-primary)] px-4 text-sm font-bold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--customer-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Terapkan tema
              </button>
              {selectedTheme !== theme ? (
                <button
                  type="button"
                  onClick={() => setDraftTheme(null)}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-[var(--customer-muted)] hover:bg-[#F4F6FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--customer-primary)]"
                >
                  Batalkan pratinjau
                </button>
              ) : null}
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--customer-muted)]">Preferensi disimpan di browser ini dan dapat diubah kapan saja.</p>
          </section>
        </div>
      ) : null}
    </section>
  );
}
