# JogjaHub Web — Design Spec: Landing Page + Login (Customer & Tenant)

> **Status:** Siap diimplementasikan oleh junior programmer / AI model murah.
> **Scope:** Hanya frontend `jogjahub-web`. **DILARANG mengubah folder `jogjahub-backend`.**

---

## 1. Ringkasan

Buat **landing page (beranda)** untuk website JogjaHub di `jogjahub-web` beserta halaman
**Login multi-role** yang hanya melayani **Customer** dan **Tenant** (role admin tidak
ditampilkan di halaman publik). Semua desain wajib mengikuti **tema JogjaHub** (Bright
Orange + Navy + Lexend/Inter) yang sudah dipakai di aplikasi mobile.

Stack yang dipakai (sudah ada di `jogjahub-web`):
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (`src/app/globals.css` sudah `@import "tailwindcss"`)
- Komponen reusable: `src/components/ui/{Button,Card,Input,Modal}.tsx`
- Layout: `src/components/layout/{Navbar,Footer,Sidebar}.tsx`
- Constants rute: `src/constants/routes.ts`

## 2. Referensi

| Referensi | Lokasi | Keterangan |
|---|---|---|
| Wireframe layout landing | `jogjahub-web/references/layout_landingpage.png` | Monokrom (abu-abu), layout dasar landing |
| Visual mockup landing | `jogjahub-web/references/landingpage.png` | Navy gelap + aksen terang, tampilan mobile-first |
| Design token mobile (sumber tema) | `jogjahub-mobile/src/constants/theme/colors.ts` | JANGAN diubah, jadikan acuan warna |
| Preview visual (artefak ini) | `jogjahub-web/references/landing-page-preview.html` | Prototipe interaktif yang bisa dibuka di browser |
| Banner hero (artefak ini) | `jogjahub-web/references/banners/` | 3 art direction banner hero |

Gaya landing mengikuti pola **Hero → Kategori → Cara Kerja → Testimoni/Proof → CTA Tenant →
Footer**, dikombinasikan dengan aksen login Customer/Tenant di Navbar.

## 3. Design Tokens (Wajib Konsisten)

Buat file `src/constants/theme.ts` (atau CSS variables di `src/app/globals.css`) dengan nilai
persis berikut (diambil dari theme mobile JogjaHub, `colors.ts`):

| Token | Hex | Penggunaan |
|---|---|---|
| `primary` | `#A04100` | Teks/link aksen amber-gelap, fokus ring |
| `primaryContainer` (CTA) | `#FF6B00` | **WARNA UTAMA CTA** (tombol Masuk/Daftar, highlight) |
| `onPrimary` | `#FFFFFF` | Teks di atas tombol oranye |
| `navy` | `#1E293B` | Header/hero/footer gelap, teks headline |
| `onNavy` | `#FFFFFF` | Teks di atas navy |
| `navyAccent` | `#FBBF24` | Aksen kuning (badge, highlight angka) |
| `navySub` | `#94A3B8` | Teks muted di section gelap |
| `surface` | `#F8F9FF` | Latar halaman terang |
| `surfaceVariant` | `#E6EEFF` | Latar kartu/akordion lembut |
| `surfaceContainer` | `#EFF4FF` | Chip/segmen control |
| `onSurface` | `#121C2A` | Teks utama di latar terang |
| `onSurfaceVariant` | `#5A4136` | Teks sekunder/keterangan |
| `secondaryContainer` | `#D3E2ED` | Background sekunder (light blue) |
| `outline` | `#8E7164` | Border lembut |
| `error` | `#BA1A1A` | Pesan error form |
| `success` | `#2E7D32` | Status sukses / tersedia |
| `white` | `#FFFFFF` | Kartu, permukaan utama |

### 3.1 Typography
| Kelas | Font | Berat | Catatan |
|---|---|---|---|
| Headline | **Lexend** | 700 (Bold) | Judul besar hero, h1 |
| Sub-headline | **Lexend** | 600 (SemiBold) | Judul section |
| Body | **Inter** | 400/500 | Paragraf, label |

Import Google Fonts di `src/app/layout.tsx` melalui `next/font/google` jika belum ada
(`Lexend` untuk display, `Inter` untuk body), lalu tetapkan `fontFamily` pada
`--font-*` di globals/theme.

### 3.2 Radius, Shadow, Spacing
- Radius kartu: `1rem`–`1.5rem` (rounded-xl/2xl), tombol diutamakan pill jika ringan (`rounded-full`)
- Shadow kartu: lembut (`shadow-sm`/`shadow-md`), hover `shadow-lg` + translate-y naik tipis
- Spacing vertikal antar section: `16–24` (py-16/py-24), container `max-w-7xl`

---

## 4. Struktur Halaman Landing (`src/app/page.tsx`)

Kerangka besar, TOP-DOWN:

```
Navbar (sticky, putih dengan blur)
├── Logo "JogjaHub" (teks bold + aksen oranye pada "Jogja")
├── Menu: Beranda · Layanan · Kategori · Cara Kerja · Untuk Tenant
└── Aksi: [Masuk] (ghost/outline) · [Daftar] (oranye)  ← CTA login

Hero (Navy #1E293B, gradasi ke #0F172A, jelas di referensi landingpage.png)
├── Badge kecil: "Platform Wisuda #1 di Yogyakarta" (chip kuning navyAccent)
├── H1 besar (Lexend Bold): "Satu Aplikasi untuk Semua Kebutuhan Wisudamu 💐"
│   → pertimbangkan teks tanpa emoji jika tidak ingin; teks utama di issue
├── P subheadline: jelaskan 3 kategori (Beauty & Style, Penginapan, Gifting)
├── CTA: [Cari Layanan →] (oranye) · [Daftar sebagai Tenant] (outline putih)
└── Visual: mockup ponsel / kartu kategori melayang (optional, placeholder)

Social Proof Strip (putih/abu sangat muda)
├── angka: 500+ Vendor · 3 Kategori · 10.000+ Booking · 4.8 Rating
└── tekankan navyAccent untuk angka

Kategori Layanan (surface #F8F9FF)
├── Judul section: "Pilih Kebutuhan Wisudamu"
├── 3 kartu besar (mirip referensi mockup):
│   1. Beauty & Style (Salon, MUA, Butik)  → ikon
│   2. Hotel & Penginapan (dekat kampus)    → ikon
│   3. Gifting (Buket, Selempang, Plakat)   → ikon
└── masing-masing kartu punya tombol "Jelajahi" (link ke /login?role=customer)

Cara Kerja (3 langkah, surfaceContainer/putih)
├── 1. Pilih vendor & layanan
├── 2. Atur slot waktu (termasuk dini hari)
└── 3. Booking, bayar manual/COD, konfirmasi vendor

Untuk Tenant / CTA Vendor (Navy, kontras tinggi)
├── Kiri: headline "Buka Toko Gratis di JogjaHub" + bullet manfaat
└── Kanan: [Daftar sebagai Tenant] (oranye besar) + note "Verifikasi 1×24 jam"

Testimoni (opsional, jika ada data; fallback statis 2-3 kartu)
CTA akhir + Footer (navy, 3 kolom: Produk · Perusahaan · Kontak)
```

### 4.1 Komponen baru yang perlu dibuat
- `src/components/landing/HeroSection.tsx`
- `src/components/landing/CategoriesSection.tsx`
- `src/components/landing/HowItWorks.tsx`
- `src/components/landing/TenantCTA.tsx`
- `src/components/landing/TrustStrip.tsx` (social proof)
- `src/components/landing/Testimonials.tsx` (opsional)

> Komponen dapat juga dibuat sebagai section dalam satu file `page.tsx` jika lebih
> sederhana — yang penting **konsisten** dengan token di Section 3.

---

## 5. Halaman Login (`src/app/login/page.tsx`)

### 5.1 Requirement
- Akses publik di `/login`.
- **Multi-role tab**: `Customer | Tenant` (dua tab besar di bagian atas kartu).
  - Default tab: **Customer**.
  - Role **Admin tidak ditampilkan** di halaman publik ini (login admin tetap bisa
    masuk via API jika diperlukan, tapi tidak ada UI tab admin).
- Tampilan konsisten dengan halaman auth mobile baru (`RoleSwitchTab` + kartu putih).

### 5.2 Layout
```
Full-height section (latar: surface atau gradasi navy samar)
└── Kartu login putih (max-w-md)
    ├── Logo/teks "JogjaHub"
    ├── Segmented control role [Customer | Tenant]
    ├── Judul: "Masuk sebagai Customer" / "Masuk sebagai Tenant"
    ├── Form:
    │   ├── Email (Input #email)
    │   ├── Password (Input #password, type=password)
    │   ├── [Masuk] → CTA Bright Orange penuh lebar
    │   └── Pesan error (warna error #BA1A1A)
    ├── Tautan "Lupa password?" (opsional, nonaktif sementara) 
    └── Footer form: "Belum punya akun? Daftar sebagai Customer/Tenant"
```

### 5.3 Perilaku
- Mengganti tab **hanya mengubah label/judul/placeholder**, form tetap sama (email +
  password). Perubahan role di-handle dengan React state (`useState<"customer"|"tenant">`).
- Submit → `POST {API_BASE_URL}/login` dengan body `{ email, password, role }`.
  - `API_BASE_URL` dari `src/lib/api.ts` (`NEXT_PUBLIC_API_URL`).
- Respons sukses: simpan token via `src/lib/auth.ts` (`setAuthToken`), lalu:
  - role `customer` → `/dashboard` (atau halaman katalog customer bila tersedia)
  - role `tenant` → `/vendor`
- Validasi client-side ringan: email format + password ≥ 6 karakter; tampilkan teks error.
- Belum perlu integrasi penuh axios: `fetch` via `apiGet`/`apiPost` dari `src/lib/api.ts`
  sudah cukup untuk MVP web; jangan paksa menambah library.

> Catatan penting: back-end endpoint boleh disesuaikan namanya oleh developer jika
> dokumentasi API aktual berbeda, TETAPI dilarang mengubah kode `jogjahub-backend`.

---

## 6. Banner Design (Hero Website)

### 6.1 Informasi Umum
| Item | Nilai |
|---|---|
| Tujuan | Website hero banner untuk landing page |
| Platform | Website (full-width hero) |
| Ukuran dasar | 1920 × 1080 (crop aman 70-80% tengah); versi render 1500 × 500 |
| Ratio | ~3:1 |
| CTA | Satu CTA per banner: **"Mulai Sekarang"** (Bright Orange) |
| Tema | Bright Orange `#FF6B00` + Navy `#1E293B` + NavyAccent `#FBBF24` |
| Font | Lexend (headline) + Inter (body) |

Artifact render: `references/banners/` (3 varian):
1. `banner-hero-gradient.html` — Gradient mesh oranye→navy, modern SaaS.
2. `banner-hero-bold-type.html` — Bold Typography, headline raksasa sebagai hero.
3. `banner-hero-photo.html` — Photo/illustration-based (tema wisuda + merchandise).

### 6.2 Copywriting (di pakai semua varian, boleh diatur ulang)
- **Headline:** "Semua Kebutuhan Wisudamu, Satu Platform"
- **Subhead:** "Salon, butik, penginapan, dan gifting — booking online tanpa antre dini hari."
- **CTA:** "Mulai Sekarang"
- **Badge (opsional):** "Platform Wisuda #1 di Yogyakarta"

### 6.3 Safe zone & Rule
- Konten kritis (headline + CTA) di area 70-80% tengah canvas.
- Maksimal 2 typefaces (Lexend + Inter), body min 16px, headline ≥ 32px.
- Teks ≤ 20% dari luas canvas.
- Kontras: teks putih di atas navy/oranye ≥ 4.5:1.
- Satu CTA utama, posisi bottom-right atau setelah subhead, tinggi ≥ 44px.
- Jangan pakai emoji sebagai ikon struktural; gunakan SVG/Lucide.

### 6.4 Spesifikasi visual per varian
1. **Gradient:** latar mesh gradient dari `#FF6B00` (kiri-atas) lalu `#A04100`,
   berakhir `#1E293B` (kanan-bawah); lingkaran blur lembut; headline putih Lexend Bold;
   CTA putih dengan teks navy, atau CTA navy dengan teks putih.
2. **Bold Typography:** latar navy solid `#1E293B`; headline raksasa (fill transparan
   dengan outline / stroke oranye) menyentuh kanvas; badge `#FBBF24` kecil di kiri atas.
3. **Photo-Based:** ilustrasi/SVG sederhana bernuansa wisuda (topi wisuda, buket,
   jam, kalender) dengan overlay gradasi navy; area teks kiri, visual kanan.

---

## 7. Style Guide & Micro-interaction

- **Hover tombol:** naik 1-2px (translateY -2px) + shadow membesar, transisi 150-300ms.
- **Kartu kategori:** hover lift (`hover:-translate-y-1 hover:shadow-lg`), ikon membesar tipis.
- **Focus ring:** `focus-visible:ring-2 ring-[#FF6B00] ring-offset-2` untuk aksesibilitas.
- **Reduced motion:** hormati `prefers-reduced-motion` — nonaktifkan lift/animation.
- **Navbar:** sticky, `bg-white/90 backdrop-blur`, border bawah tipis.
- **Responsive:** mobile-first; grid kategori `grid-cols-1 md:grid-cols-3`; navbar menu
  collapse menjadi hamburger di < md. Landing harus nyaman di 375px, 768px, 1024px, 1440px.
- **Bahasa:** seluruh UI baru memakai **Bahasa Indonesia** (sesuai PRD, hanya ID).

---

## 8. Acceptance Criteria

1. `/` menampilkan landing page lengkap (Navbar, Hero, Social Proof, 3 Kategori,
   Cara Kerja, CTA Tenant, Footer) dengan tema JogjaHub (Bright Orange + Navy).
2. `/login` menampilkan segmented control **Customer | Tenant**; tab Customer aktif secara default.
3. Submit login mengirim `{ email, password, role }` ke API, menyimpan token
   (`setAuthToken`), dan redirect sesuai role.
4. Role admin tidak muncul di UI publik landing & login.
5. Seluruh teks baru berbahasa Indonesia.
6. Tidak ada perubahan apa pun pada `jogjahub-backend` (pastikan `git diff` bersih utk folder itu).
7. Responsif di breakpoint CTA: 375 / 768 / 1024 / 1440; tidak ada horizontal scroll.
8. `bun run build` dan `bun run lint` di `jogjahub-web` sukses tanpa error.
9. Banner hero terpasang sebagai visual di section Hero (boleh placeholder di `public/`).
10. A11y: focus visible, alternative text pada ikon/ilustrasi, kontras teks ≥ 4.5:1.

---

## 9. Definisi Selesai (DoD) untuk AI / Junior

- Seluruh file yang dibuat/diubah tercantum di **Deskripsi perubahan** PR.
- Screenshot hasil (mobile + desktop) disertakan di PR.
- Test manual: buka `/` dan `/login`, ganti tab role, submit dengan data uji.
- Jelaskan endpoint API yang digunakan (path persisnya) di kolom komentar.
- Perlu update `agent.md`? → tidak wajib; cukup update `references/landing-page-design-spec.md`
  bila ada deviasi design yang disetujui.

---

## 10. Lampiran: Peta File yang Terkena (REKOMMENDASI)

```
jogjahub-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # + import font Lexend/Inter via next/font/google
│   │   ├── page.tsx              # ✏️ REWRITE → landing page
│   │   ├── globals.css           # + theme tokens (CSS vars / @theme), font family
│   │   └── login/
│   │       └── page.tsx          # ✏️ REWRITE → multi-role login Customer|Tenant (client component)
│   ├── components/
│   │   ├── landing/              # (baru) section komponen landing
│   │   │   ├── Navbar.tsx        # (boleh pindah dari layout/Navbar)
│   │   │   ├── HeroSection.tsx
│   │   │   ├── TrustStrip.tsx
│   │   │   ├── CategoriesSection.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── TenantCTA.tsx
│   │   │   └── Footer.tsx        # (boleh pindah dari layout/Footer)
│   │   └── auth/
│   │       └── RoleSwitchTab.tsx # (baru) segmented control Customer|Tenant
│   ├── constants/
│   │   ├── routes.ts             # (opsional) tambah route katalog bila ada
│   │   └── theme.ts              # (baru) design tokens, opsional
│   └── lib/
│       └── api.ts                # (opsional) tambah apiPost() bila diperlukan
```

> File `Navbar.tsx`/`Footer.tsx` yang sudah ada dapat diupdate di tempat tanpa
> memindahkan folder. Komponen `landing/*` hanya *recommendation* — keputusan akhir
> boleh disesuaikan implementor selama Acceptance Criteria terpenuhi.