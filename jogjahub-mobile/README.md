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
| `EXPO_PUBLIC_API_URL` | Base URL backend. Android emulator: `http://10.0.2.2:8000/api/v1`. Perangkat fisik: `http://<IP-LAN>:8000/api/v1`. |
| `EXPO_PUBLIC_MAPS_API_KEY` | Google Maps API key (diisi saat fitur peta aktif). |

For a physical device, use the backend computer's LAN IP and keep both devices on the same Wi-Fi.
Restart Expo with `npx expo start -c` after changing `.env`.

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

## Kalender tenant

Screen kalender tenant menggunakan endpoint yang sudah tersedia:

- `GET /tenant/services` untuk layanan milik tenant yang sedang login.
- `GET /tenant/services/{service}/time-slots` untuk seluruh slot layanan (termasuk tanggal lampau, tidak dipaginasi, urut tanggal dan jam).
- `POST /tenant/time-slots` untuk membuat satu slot (`service_id`, `slot_date`, `start_time`, `end_time`, `quota`).
- `DELETE /tenant/time-slots/{timeSlot}` untuk menghapus slot. Backend menolak penghapusan jika slot sudah memiliki booking.
- `GET /tenant/bookings` untuk booking tenant; response dipaginasi (15 item per halaman), berisi layanan, slot, pemesan, dan status. Screen mengikuti `meta.last_page` dan hanya menampilkan data yang cocok dengan layanan serta tanggal terpilih.
- `GET /categories` mengembalikan kategori dan subkategori aktual. Kalender mencocokkan `service.subcategory.id` dari daftar layanan tenant ke daftar tersebut; layanan dalam kategori `Penginapan` menampilkan input jam, kategori lain menyembunyikannya.

Endpoint tenant memerlukan autentikasi, role tenant, dan tenant yang disetujui. Data slot menggunakan `quota` dan `booked_count`; sisa kapasitas dihitung sebagai `max(0, quota - booked_count)`. Booking pada kalender dikelompokkan menggunakan `slot.slot_date`.

### Batasan API saat ini

- `POST /tenant/time-slots` tetap mewajibkan `start_time` dan `end_time` (`H:i`) untuk semua layanan. Untuk non-penginapan, UI menyembunyikan kedua input tetapi mengirim nilai standar yang sudah digunakan sebelumnya (`08:00`–`09:00`); kontrak API tidak diubah.
- Pembuatan slot hanya menerima satu `slot_date` per request dan tidak atomik untuk beberapa tanggal. Mode multi-tanggal di aplikasi mengirim request satu per satu; jika sebagian gagal, hasil sukses dan gagal ditampilkan terpisah. Slot yang sukses tidak dibatalkan otomatis.
- Backend belum memvalidasi duplikasi atau waktu yang tumpang tindih saat membuat slot. Aplikasi mencegah duplikasi waktu yang persis sama berdasarkan slot yang sudah dimuat, tetapi race antar-perangkat tetap tidak dapat dicegah oleh validasi client.
- Daftar booking belum menerima filter layanan/tanggal, sehingga aplikasi mengambil semua halaman yang tersedia untuk tenant lalu memfilter di perangkat.

Perubahan backend minimum yang disarankan sebelum menjamin konsistensi multi-perangkat: endpoint batch yang membuat slot untuk `dates[]` dalam satu transaksi dengan validasi duplikasi/konflik di server, serta filter layanan dan tanggal pada daftar booking. Dokumentasi ini mencatat gap; kontrak API backend tidak diubah oleh implementasi mobile ini.

## Verifikasi

```bash
npm run typecheck
```
