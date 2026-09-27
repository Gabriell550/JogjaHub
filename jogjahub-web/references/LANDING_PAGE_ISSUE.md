## 🎯 Tujuan

Membangun **landing page** untuk website JogjaHub di `jogjahub-web` serta halaman
**Login multi-role (Customer | Tenant)** dengan design mengikuti **tema resmi JogjaHub**
(Bright Orange + Navy + Lexend/Inter), mengacu pada layout referensi di
`jogjahub-web/references/`.

> **PENTING:** Hanya frontend `jogjahub-web` yang diubah. **DILARANG menyentuh folder
> `jogjahub-backend`.** Seluruh UI baru berbahasa Indonesia.

---

## 📁 Referensi Desain

| Item | Lokasi |
|---|---|
| Spec desain lengkap (design tokens, layout, komponen) | `jogjahub-web/references/landing-page-design-spec.md` |
| Wireframe layout referensi | `jogjahub-web/references/layout_landingpage.png` |
| Mockup visual referensi | `jogjahub-web/references/landingpage.png` |
| Preview interaktif (buka di browser) | `jogjahub-web/references/landing-page-preview.html` |
| Banner hero varian 1 — Gradient | `jogjahub-web/references/banners/banner-hero-gradient.html` |
| Banner hero varian 2 — Bold Typography | `jogjahub-web/references/banners/banner-hero-bold-type.html` |
| Banner hero varian 3 — Photo/Illustrated | `jogjahub-web/references/banners/banner-hero-photo.html` |
| Tema mobile (sumber warna) | `jogjahub-mobile/src/constants/theme/colors.ts` (JANGAN diubah) |

**Baca `landing-page-design-spec.md` terlebih dahulu** — dokumen itu berisi semua detail
yang harus diimplementasikan.

---

## 🧭 Ringkasan Yang Harus Dibuat

### A. Landing Page (`src/app/page.tsx`)
Rangkaian section (top-down):
1. **Navbar sticky** (putih blur): logo JogjaHub, menu (Beranda, Layanan, Kategori,
   Cara Kerja, Untuk Tenant), aksi **[Masuk]** (outline) + **[Daftar]** (oranye `#FF6B00`).
2. **Hero** (navy `#1E293B`/`#0F172A`): badge kuning, H1 Lexend Bold, subheadline,
   CTA oranye "Cari Layanan" + outline "Daftar sebagai Tenant", mockup ponsel (optional).
3. **Social Proof strip**: 500+ Vendor · 3 Kategori · 10rb+ Booking · 4.8 Rating
   (angka dengan `#FBBF24`).
4. **Kategori Layanan** (3 kartu): Beauty & Style · Hotel & Penginapan · Gifting,
   masing-masing tombol "Jelajahi".
5. **Cara Kerja** (3 langkah bernomor).
6. **CTA Tenant** (navy): "Buka Toko Gratis di JogjaHub" + CTA oranye.
7. **Testimoni** (3 kartu, disarankan).
8. **Footer** (navy, 4 kolom).

### B. Login (`src/app/login/page.tsx`)
- Segmented control **Customer | Tenant** (tab Customer aktif default).
- Role **admin TIDAK ditampilkan** di UI publik.
- Form: email + password + tombol oranye penuh-lebar.
- Submit → `POST {API_BASE_URL}/login` dengan `{ email, password, role }`.
- Simpan token via `setAuthToken()` (`src/lib/auth.ts`).
- Redirect: role `customer` → `/dashboard`, role `tenant` → `/vendor`.
- Validasi client-side ringan (email format, password ≥ 6 karakter), pesan error `#BA1A1A`.

### C. Token Desain (wajib)
- CTA: `#FF6B00` · primary gelap: `#A04100` · navy: `#1E293B`/`#0F172A`
- Aksen kuning: `#FBBF24` · surface: `#F8F9FF` · surface variant: `#E6EEFF`
- Teks terang: `#121C2A` · muted: `#5A4136` · sukses: `#2E7D32` · error: `#BA1A1A`
- Font: **Lexend** (headline, 600/700) + **Inter** (body 400/500) via `next/font/google`.
- Hover: translate-y -1/2px + shadow membesar (150–300ms); hormati `prefers-reduced-motion`.
- Responsive breakpoints: 375 / 768 / 1024 / 1440 (mobile-first).

### D. Banner Hero
Pasang visual hero banner (boleh dari `references/banners/` atau dibuat ulang) pada
section Hero. Pilih salah satu dari daftar varian, atau buat ilustrasi serupa dengan
palet yang sama. Ukuran referensi 1500×500 (~3:1), konten aman di tengah 70-80%.

---

## 📄 File yang Diperkirakan Terkena (rekomendasi)

```
jogjahub-web/src/app/page.tsx              → landing page
jogjahub-web/src/app/login/page.tsx        → multi-role login (client component)
jogjahub-web/src/app/layout.tsx            → import font Lexend/Inter
jogjahub-web/src/app/globals.css           → theme tokens + font-family
jogjahub-web/src/components/auth/RoleSwitchTab.tsx  → (baru)
jogjahub-web/src/components/landing/*      → section landing (baru, opsional)
jogjahub-web/src/lib/api.ts                → tambah apiPost() bila diperlukan (opsional)
```

> Struktur akhir boleh disesuaikan implementor selama **Acceptance Criteria** terpenuhi.

---

## ✅ Acceptance Criteria

1. `/` menampilkan landing lengkap sesuai spec dengan tema JogjaHub.
2. `/login` punya segmented control `Customer | Tenant`; Customer aktif default; admin
   tidak muncul.
3. Submit login mengirim `{ email, password, role }`, simpan token, redirect sesuai role.
4. Seluruh teks baru berbahasa Indonesia.
5. Tidak ada perubahan di `jogjahub-backend` (`git diff` folder tsb bersih).
6. Responsif 375/768/1024/1440 tanpa horizontal scroll.
7. `bun run build` dan `bun run lint` di `jogjahub-web` sukses.
8. Banner hero terpasang di hero section.
9. A11y: focus visible, alt text pada ikon, kontras teks ≥ 4.5:1.

---

## 🖼️ Screenshot PR
Wajib menyertakan screenshot **mobile + desktop** untuk `/` dan `/login` di deskripsi PR,
serta menyebutkan endpoint API login yang digunakan secara persis.

## 🏷️ Labels
`enhancement`, `frontend`, `web`, `good first issue`