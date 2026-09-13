# Roadmap Backend — JogjaHub
**Durasi:** 4 bulan (16 minggu) | **Stack:** PHP Laravel 11 + MySQL 8 + Sanctum | **Konsumer:** React Native

Roadmap dibagi 4 fase (per bulan), masing-masing berisi sprint 2 minggu. Urutan disusun berdasarkan dependency: modul yang jadi fondasi modul lain dikerjakan lebih dulu (misal auth & kategori harus ada sebelum booking bisa dibangun).

---

## Bulan 1 — Fondasi: Setup, Auth, RBAC, Vendor Onboarding

### Sprint 1 (Minggu 1–2)
- [ ] Setup project Laravel + konfigurasi MySQL, `.env`, repo Git (branch `main`/`develop`)
- [ ] Install & konfigurasi Sanctum untuk token-based auth
- [ ] Migration & model dasar: `users` (dengan kolom `role`)
- [ ] Endpoint: register customer, register vendor (form terpisah sesuai FR-01), login, logout
- [ ] Middleware RBAC (`role:customer/vendor/admin`) + route group per role
- [ ] Password hashing (Bcrypt, default Laravel) — pastikan tidak ada plaintext log
- [ ] Unit/feature test dasar: register & login per role

**Milestone:** Semua role bisa register & login, dapat token, dan diarahkan ke akses sesuai role.

### Sprint 2 (Minggu 3–4)
- [ ] Migration & model: `categories`, `subcategories`, `vendor_profiles`, `vendor_categories`
- [ ] Seeder kategori & subkategori awal (Penginapan, Beauty & Style, Gifting, Dokumentasi + sub-kategorinya)
- [ ] Endpoint vendor: lengkapi profil bisnis (nama usaha, alamat, lat/long, WhatsApp) + pilih kategori (checkbox, many-to-many) — FR-03
- [ ] Endpoint admin: list vendor `pending`, approve/reject — FR-04
- [ ] Policy: vendor hanya bisa edit profilnya sendiri; admin punya akses approval
- [ ] Notifikasi sederhana (email/log) saat status vendor diubah admin

**Milestone:** Vendor bisa daftar & lengkapi profil, admin bisa approve/reject, vendor approved otomatis "aktif" di sistem.

---

## Bulan 2 — Katalog: Kategori, Service, Peta, Slot

### Sprint 3 (Minggu 5–6)
- [ ] Migration & model: `services` (relasi ke `vendor_profiles` & `subcategories`)
- [ ] Endpoint vendor: CRUD service/produk miliknya (nama, deskripsi, harga, foto)
- [ ] Endpoint customer: list kategori utama (FR-05), list subkategori + filter service by subkategori (FR-06)
- [ ] Upload foto service (validasi tipe & ukuran file, simpan ke `storage/app/public`)
- [ ] Pagination di semua endpoint list

**Milestone:** Vendor bisa publish service, customer bisa browse & filter service per kategori/subkategori.

### Sprint 4 (Minggu 7–8)
- [ ] Endpoint: data lokasi vendor untuk peta (lat/long + info dasar) — FR-07
- [ ] Migration & model: `time_slots` (relasi ke `services`)
- [ ] Endpoint vendor: buat/atur slot waktu + kuota per slot (termasuk slot dini hari)
- [ ] Endpoint customer: lihat slot tersedia per service (exclude slot yang `booked_count >= quota`)
- [ ] Test: validasi kuota slot tidak bisa negatif/overbooked di level query

**Milestone:** Data vendor siap ditampilkan di peta (integrasi Leaflet/Google Maps dilakukan di sisi frontend), dan sistem slot waktu siap dipakai untuk booking.

---

## Bulan 3 — Transaksi Inti: Booking, Manajemen Pesanan, Chatbot FAQ

### Sprint 5 (Minggu 9–10)
- [ ] Migration & model: `bookings`
- [ ] Endpoint customer: buat booking (pilih service + slot) — FR-08
- [ ] **Business logic kritis:** `lockForUpdate()` + DB transaction saat insert booking untuk cegah race condition slot penuh (sesuai mitigasi risiko di PRD)
- [ ] Booking tercatat dengan status awal `pending` — FR-09
- [ ] Upload bukti transfer manual (`payment_proof_url`) atau tandai metode COD/Pay on Arrival
- [ ] Endpoint customer: list booking miliknya (List Booking)

**Milestone:** Customer bisa booking end-to-end dengan slot capacity yang aman dari race condition.

### Sprint 6 (Minggu 11–12)
- [ ] Endpoint vendor: list booking masuk + ubah status `confirmed`/`cancelled` — FR-10
- [ ] Endpoint customer: cancel booking (dengan validasi syarat waktu) — FR-11
- [ ] State machine validasi status booking (tidak bisa ubah booking yang sudah `cancelled`, dst)
- [ ] Migration & model: `faqs`, `chatbot_conversations`, `chatbot_messages`
- [ ] Service class `FaqMatcherService` (keyword matching sederhana)
- [ ] Endpoint chatbot: kirim pertanyaan → cari FAQ cocok → log ke `chatbot_messages`
- [ ] Seeder FAQ awal (cara booking, cara bayar, cara jadi vendor, dll)

**Milestone:** Alur booking penuh (create → confirm/cancel) berfungsi, chatbot FAQ dasar sudah bisa dites.

---

## Bulan 4 — Review, Admin, Hardening, Deployment

### Sprint 7 (Minggu 13–14)
- [ ] Migration & model: `reviews`
- [ ] Endpoint customer: beri review setelah booking selesai (validasi status booking dulu)
- [ ] Endpoint admin: monitoring transaksi (list semua booking + filter status/tanggal/vendor)
- [ ] Endpoint admin: dashboard ringkas (jumlah vendor pending, booking hari ini, dll — sesuai kebutuhan "menjaga kualitas layanan")
- [ ] Review checklist keamanan dari backend guideline (rate limiting login/register, CORS, `APP_DEBUG=false` di config staging)

**Milestone:** Semua fitur fungsional MVP lengkap end-to-end, admin punya visibilitas penuh ke transaksi.

### Sprint 8 (Minggu 15–16)
- [ ] Regression test menyeluruh: auth, vendor approval, booking + slot capacity, review, chatbot
- [ ] Load test sederhana untuk endpoint katalog & booking (cek target load time <3 detik dari NFR)
- [ ] Perbaikan bug dari hasil integrasi dengan tim React Native (buffer paling penting — biasanya di sini banyak mismatch response API ditemukan)
- [ ] Setup environment production (Nginx + PHP-FPM, migrate `--force` via CI/CD, backup DB terjadwal)
- [ ] Dokumentasi API final (Postman Collection/Scribe) untuk hand-off ke tim frontend & dokumentasi internal
- [ ] Deploy ke staging → UAT → deploy production

**Milestone:** Backend stabil, teruji, dan live di production siap dipakai untuk periode wisuda.

---

## Dependency Penting ke Tim Frontend (React Native)
- Kontrak API (format response, nama field) harus **fix di akhir Sprint 1–2** supaya tim frontend bisa mulai integrasi paralel, bukan menunggu backend 100% selesai.
- Endpoint peta (Sprint 4) dan upload file (Sprint 3 & 5) sebaiknya didemokan lebih awal ke frontend karena biasanya paling banyak butuh penyesuaian format.

## Risiko Timeline
- **Slot capacity logic (Sprint 5)** adalah bagian paling berisiko secara teknis — kalau ada keterlambatan, prioritaskan ini dibanding fitur chatbot (chatbot FAQ bisa di-downgrade ke static list kalau waktu mepet, tapi slot capacity tidak boleh dikompromikan karena itu masalah utama di latar belakang PRD).
- Sisakan minimal 1 sprint penuh (Sprint 8) khusus untuk bug fixing hasil integrasi — jangan dipakai untuk fitur baru.
