# [Web Tenant] Bangun dashboard, layanan, kalender, pesanan, dan manajemen akun

## Tujuan

Tenant yang sudah disetujui bisa menjalankan pekerjaan sehari-hari dari web melalui **Dashboard, Layanan, Kalender, Pesanan, dan Manajemen Akun**. Ikuti alur aplikasi mobile dengan tata letak yang sesuai untuk desktop dan layar kecil.

Saat ini `jogjahub-web/src/app/vendor/` sudah memiliki kelima rute. Dashboard masih memakai angka statis, empat halaman lainnya masih placeholder, dan area ini belum punya layout tenant bersama. Login tenant yang disetujui sudah mengarah ke `/vendor`.

## Persiapan

- Kerjakan dari branch yang memuat perubahan `mobile-app` pada commit `84aee941` atau merge yang sudah mencakupnya. Baca `jogjahub-web/AGENTS.md`, panduan Next lokal yang dirujuknya, dan `jogjahub-backend/routes/api.php`.
- Pakai `src/hooks/useAuth.ts`, `src/lib/api.ts`, `src/constants/routes.ts`, komponen UI, dan gaya web yang ada. Lihat `src/app/admin/layout.tsx` dan `src/components/customer/CustomerDashboardShell.tsx` untuk pola layout dan sesi.
- Semua endpoint di bawah relatif terhadap `NEXT_PUBLIC_API_URL` yang sudah mencakup `/api/v1`. Data layout admin dan customer tetap dipakai oleh rutenya masing-masing.

## Urutan implementasi

| Langkah | File/rute utama di `jogjahub-web` | Hasil yang harus berfungsi |
| --- | --- | --- |
| 1. Layout dan sesi | Buat `src/app/vendor/layout.tsx`. pakai ulang konstanta rute | Sidebar pada desktop dan menu yang bisa dibuka dengan keyboard pada layar kecil. Tunggu hidrasi sesi. tanpa sesi arahkan ke `/login?role=tenant`. Pengguna dengan role lain tidak melihat konten tenant. Gunakan status dari `GET /tenant/profile` untuk membatasi operasi bagi tenant yang belum approved. |
| 2. Dashboard | `src/app/vendor/page.tsx` | Tampilkan nama toko, jumlah layanan, jumlah pesanan, dan pesanan terbaru dengan tautan ke detail. Ambil jumlah dari `meta.total` untuk `GET /tenant/services` dan `GET /tenant/bookings`. Gunakan data kosong dari API jika toko baru. |
| 3. Layanan | `src/app/vendor/services/page.tsx` dan komponen form di `src/features/vendor/` | Daftar, tambah, edit, aktif/nonaktif, dan hapus layanan dengan konfirmasi. Gunakan `GET/POST /tenant/services` serta `GET/PATCH/DELETE /tenant/services/{id}`. Isi subkategori dari `GET /categories`. Form mendukung nama, deskripsi, harga, tipe harga `per_session` atau `per_night`, status, dan foto. |
| 4. Kalender | `src/app/vendor/calendar/page.tsx` | Pilih layanan, lihat jadwal dan sisa kuota per tanggal, tambah dan hapus slot. Gunakan `GET /tenant/services/{id}/time-slots`, `POST /tenant/time-slots`, dan `DELETE /tenant/time-slots/{id}`. Form mengirim `service_id`, `slot_date` (YYYY-MM-DD), `start_time` / `end_time` (HH:mm), dan `quota` (integer ≥ 1). Tampilkan pesan 422 jika slot sudah terpakai. API yang tersedia mendukung tambah dan hapus slot. |
| 5. Pesanan | `src/app/vendor/orders/page.tsx`, tambah `src/app/vendor/orders/[uuid]/page.tsx` | Daftar berpaginasi dan detail dari `GET /tenant/bookings` dan `GET /tenant/bookings/{uuid}`. Tampilkan kode pesanan, pelanggan, layanan, jadwal, nominal `total_amount`, status pesanan, dan status pembayaran jika tersedia. Tindakan terima/tolak berlaku untuk pesanan lama berstatus `pending` melalui `PATCH /tenant/bookings/{uuid}/status` dengan `status: "confirmed"` atau `"cancelled"`. |
| 6. Manajemen Akun | `src/app/vendor/profile/page.tsx` | Tampilkan identitas akun dan status toko. Edit nama toko, deskripsi, alamat, lokasi, kontak bisnis, dan kategori melalui `GET/PUT /tenant/profile`. Sediakan keluar dengan fungsi sesi yang tersedia. Gunakan status hasil respons setelah simpan. |

## Detail yang mudah terlewat

- Foto layanan dikirim sebagai `photos[]` melalui `FormData`. Untuk edit dengan file gunakan `POST` ke URL layanan dengan `_method=PUT`, mengikuti `jogjahub-mobile/src/api/vendorApi.ts`. Foto yang dihapus memakai `remove_photos[]` dengan path dari `photo.url`. Maksimal 10 foto total. Pakai JSON untuk edit tanpa file. Tambahkan dukungan PUT/DELETE pada API helper bersama bila diperlukan dan pertahankan format JSON/FormData yang sudah digunakan.
- Form profil mengirim `business_name`, `description`, `address` (`street`, `city`, `province`, `postal_code`), `latitude`, `longitude`, `whatsapp_number`, dan `category_ids`. Isi koordinat dari `data.location` dan ID kategori dari `data.categories`. Baca `UpdateProfileRequest.php` sebelum menambahkan pilihan provinsi atau field.
- Backend menyetel profil menjadi `pending` saat profil bisnis disimpan. Beri tahu tenant sebelum simpan, lalu perbarui status dari respons dan tutup akses ke operasi yang butuh approval. Profil tetap dapat menampilkan status. Gunakan form request backend sebagai sumber validasi. Fitur unggah ulang dokumen saat ditolak berada di alur onboarding yang terpisah.
- Gunakan status loading, kosong, gagal dengan tombol coba lagi, dan tombol simpan nonaktif saat request berjalan. Tangani 401 sebagai sesi berakhir, 403 sebagai akses ditolak, dan 422 sebagai pesan validasi dari API.
- Bagi menjadi tiga PR kecil bila perlu: layout + dashboard. layanan + kalender. pesanan + manajemen akun. Issue [Escrow demo di web](issue-escrow-pembayaran-web.md) menambahkan tindakan pengerjaan, Pendapatan, dan tujuan pencairan ke portal ini.

## Kriteria penerimaan

- [ ] Tenant approved dapat membuka lima menu, refresh deep link, dan keluar. Customer, admin, dan pengunjung tidak dapat membuka operasi tenant. Tenant yang kembali `pending` setelah edit profil melihat status terbaru.
- [ ] Dashboard menampilkan data yang cocok dengan API, termasuk keadaan tanpa layanan atau pesanan.
- [ ] Tenant dapat membuat dan mengedit layanan, mengganti status aktif, menambah/menghapus foto, dan menghapus layanan. Tenant lain tidak dapat mengedit ID layanan tersebut.
- [ ] Tenant dapat membuat slot dan melihat kuota dari API. Hapus slot kosong berhasil, sementara slot yang sudah dipesan menghasilkan pesan yang jelas.
- [ ] Daftar dan detail memuat pesanan milik tenant saja. Tombol terima/tolak hanya muncul pada pesanan `pending`.
- [ ] Navigasi dan formulir bisa digunakan pada lebar 375 px dan desktop, dengan fokus keyboard terlihat.
- [ ] Dari `jogjahub-web`, jalankan `bun run lint`, `bunx tsc --noEmit`, dan `bun run build`. Cantumkan hasilnya dan skenario uji manual di PR.

[Rute API backend](https://github.com/Gabriell550/JogjaHub/blob/84aee941/jogjahub-backend/routes/api.php) · [Referensi aplikasi mobile](https://github.com/Gabriell550/JogjaHub/tree/84aee941/jogjahub-mobile/src/features/vendor)
