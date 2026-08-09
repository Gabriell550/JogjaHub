# JogjaHub Mobile

Aplikasi mobile JogjaHub (React Native + Expo SDK 54) untuk customer, vendor, dan admin.

## Teknologi

- [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/) (React Native 0.81, React 19)
- TypeScript (strict)
- Redux Toolkit + react-redux (state management)
- React Navigation v6 (navigasi)
- Axios (HTTP client)

## Prasyarat

- Node.js 20.19.x atau lebih baru
- Expo Go (dari App Store / Play Store) untuk menjalankan tanpa build native
- Android emulator / perangkat fisik (opsional, untuk run native)

## Setup

```bash
npm install
cp .env.example .env
```

Lalu isi `.env`:

| Variabel | Keterangan |
| --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Base URL backend. Android emulator: `http://10.0.2.2:8000/api/v1`. Perangkat fisik: `http://<IP-LAN>:8000/api/v1`. |
| `EXPO_PUBLIC_MAPS_API_KEY` | Google Maps API key (diisi saat fitur peta aktif). |

## Menjalankan

```bash
npx expo start
```

- Tekan `a` untuk membuka di Android emulator, atau scan QR dengan Expo Go.
- Butuh backend berjalan: `cd jogjahub-backend && php artisan serve`.

### Build native (opsional)

```bash
npx expo run:android
```

Perintah ini akan menjalankan `expo prebuild` untuk membuat folder `android/` (dan `ios/`).

## Struktur

```
src/
  api/          # Klien axios & endpoint per domain
  components/   # UI reusable
  constants/    # Config, warna, kategori
  features/     # Fitur per role: auth, customer, vendor, admin
  hooks/        # Custom hooks
  navigation/   # Navigator per role (Auth/Customer/Vendor/Admin)
  services/     # Layanan utilitas (map, notifikasi, upload)
  store/        # Redux store
  types/        # Type definitions
  utils/        # Helper (format, validasi, tanggal)
```

Catatan: path alias (`@api/*`, `@features/*`, dst.) aktif lewat `experiments.tsconfigPaths` di `app.json` — cocok dengan `paths` pada `tsconfig.json`.

## Verifikasi

```bash
npm run typecheck
```
