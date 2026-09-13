# BAB III. BACK-END GUIDELINE

## 3.1 Tech Stack

**PHP Laravel + MySQL** | Konsumer: **React Native** (mobile-first, REST API)

| Komponen | Rekomendasi |
|----------|-------------|
| PHP | Versi 8.3 |
| Laravel | 11.x (LTS terbaru, sudah simplified skeleton) |
| Database | MySQL 8.0 |
| Auth API | Laravel Sanctum (token-based, cocok untuk mobile app) |
| Queue/Cache | Redis (opsional, minimal untuk notifikasi & cache kategori/service) |
| Storage Foto | Local disk (`storage/app/public`) untuk MVP, upgrade ke S3-compatible bila perlu |
| API Docs | Postman Collection atau Scribe (auto-generate dari kode Laravel) |

## 3.2 Database & Migration

a. Setiap tabel wajib punya migration terpisah, jangan edit migration lama yang sudah di-*merge* ke branch utama — buat migration baru untuk perubahan skema.

b. Gunakan foreign key constraint eksplisit (`->constrained()->cascadeOnDelete()` atau `restrictOnDelete()` sesuai kebutuhan — misal booking tidak boleh *cascade delete* kalau service dihapus, cukup *soft-delete* service).

c. Gunakan UUID untuk primary key entitas yang akan diekspos ke mobile app (mencegah enumerasi ID oleh pihak luar), atau minimal `id` auto-increment + kolom `uuid` terpisah kalau ingin tetap pakai auto-increment untuk performa index.

d. Kolom status sebaiknya pakai native enum Laravel (`Enums`) dicasting di model, bukan validasi manual string di banyak tempat.

e. Wajib pakai soft delete (`SoftDeletes` trait) untuk tabel: `services`, `vendor_profiles`, `bookings` — supaya data histori booking tidak hilang meski vendor/service dihapus.

f. Index tambahan wajib di kolom yang sering difilter: `vendor_profiles.status`, `bookings.status`, `time_slots.slot_date`, `services.subcategory_id`.

g. Seeder wajib untuk data master: `categories`, `subcategories`, dan minimal 1 akun admin default.

## 3.3 Entity Relationship Diagram

Ringkasan tipe relasi yang dipakai:

- **One-to-one (opsional)**: `USERS`–`VENDOR_PROFILES`, `BOOKINGS`–`REVIEWS` — karena tidak semua baris di tabel induk wajib punya pasangan.
- **One-to-many**: hampir semua relasi lain — pola paling umum di ERD ini (kategori → sub-kategori, vendor → service, service → slot, slot/service → booking, dst).
- **Many-to-many (lewat junction table)**: hanya `VENDOR_PROFILES` ↔ `CATEGORIES` lewat `VENDOR_CATEGORIES`, karena satu vendor bisa lintas kategori dan satu kategori diisi banyak vendor.

## 3.4 Autentikasi dan Otorisasi (RBAC)

- Pakai **Laravel Sanctum** untuk token-based auth (native untuk mobile SPA, bukan session cookie).
- Endpoint dikelompokkan per role lewat middleware:

```php
Route::middleware(['auth:sanctum', 'role:customer'])->prefix('customer')->group(...);
Route::middleware(['auth:sanctum', 'role:vendor'])->prefix('vendor')->group(...);
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(...);
```

- Buat custom middleware `role` atau pakai package `spatie/laravel-permission` kalau butuh permission lebih granular ke depannya.
- Gunakan **Laravel Policy** untuk otorisasi resource-level (misal: vendor hanya bisa update service miliknya sendiri, customer hanya bisa cancel booking miliknya sendiri).
- Password wajib di-hash dengan **Bcrypt** (default Laravel `Hash::make`), jangan pernah simpan/log plaintext password.

## 3.5 API Design

- RESTful & konsisten: `GET /api/v1/services`, `POST /api/v1/bookings`, dst. Selalu prefix versi (`/api/v1/`) supaya *breaking change* ke depan tidak merusak app mobile yang sudah rilis.
- Format response seragam pakai **Laravel API Resource**.
- Gunakan **FormRequest** untuk semua validasi input, jangan validasi manual di controller.
- Pagination wajib untuk endpoint list (`services`, `bookings`, dll) pakai `paginate()` bawaan Laravel, jangan *return* semua data sekaligus (penting untuk performa mobile app).
- Upload file (bukti bayar, foto service) lewat `multipart/form-data`, validasi tipe & ukuran file di FormRequest (`mimes:jpg,png,pdf|max:2048`).

## 3.6 Business Logic Kritis (Spesifik ke JogjaHub)

- **Slot capacity check**: sebelum insert booking, wajib *lock row* `time_slot` (`lockForUpdate()` dalam DB transaction) untuk menghindari *race condition* ketika banyak customer booking slot yang sama secara bersamaan — penting untuk jam-jam dini hari yang padat.
- **Vendor approval flow**: perubahan status `pending` → `approved`/`rejected` di `vendor_profiles` hanya boleh dilakukan lewat endpoint admin, dilindungi Policy, dan sebaiknya trigger notifikasi (email/push) ke vendor.
- **Booking status transition**: definisikan *state machine* sederhana (`pending` → `confirmed`/`cancelled`), validasi supaya vendor tidak bisa ubah status booking yang sudah `cancelled`.
- **Review**: validasi bahwa `booking_id` yang direview statusnya sudah `confirmed`/selesai sebelum review bisa dibuat.
- **Chatbot FAQ matching**: logic matching keyword sebaiknya di Service class terpisah (`FaqMatcherService`), bukan di controller — supaya gampang diganti algoritma matching-nya nanti (misal upgrade ke fuzzy search atau LLM).

## 3.7 Error Handling & Logging

- Gunakan **Laravel Exception Handler custom** untuk mengembalikan format JSON error konsisten (jangan biarkan Laravel return HTML error page ke mobile app).
- Log error penting (payment proof gagal upload, booking gagal karena race condition) ke `storage/logs/laravel.log` dengan level yang sesuai (`error`, `warning`, `info`).
- Jangan expose stack trace/debug info ke response production (`APP_DEBUG=false` di `.env` production).

## 3.8 Testing

- Minimal feature test untuk alur kritis: registrasi & login per role, vendor approval, booking + slot capacity, cancel booking.
- Pakai Laravel `RefreshDatabase` trait supaya test database selalu bersih tiap run.
- Target realistis untuk MVP 4 bulan: coverage tidak perlu 100%, fokus ke jalur bisnis utama (booking flow) karena ini paling berisiko kalau bug.

## 3.9 Checklist Keamanan (sebelum deploy)

- [ ] `APP_DEBUG=false` di production
- [ ] Semua endpoint sensitif dilindungi `auth:sanctum` + role middleware
- [ ] Rate limiting aktif di route login & register (throttle middleware) untuk cegah brute force
- [ ] Validasi & sanitasi semua input file upload (tipe, ukuran, rename file agar tidak predictable)
- [ ] CORS dikonfigurasi hanya untuk origin yang dipakai app React Native / domain resmi
- [ ] Password reset & email verification (kalau dipakai) pakai signed URL bawaan Laravel
