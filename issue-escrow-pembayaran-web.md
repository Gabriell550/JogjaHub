# [Web Escrow] Hubungkan checkout, pencairan tenant, dan monitoring admin

## Tujuan

Selesaikan escrow demo di web dari checkout customer sampai tenant melihat pencairan. Admin web menangani komplain dan percobaan pencairan ulang. Mobile sudah memakai backend escrow yang sama. Checkout web saat ini mengirim payload booking lama dan membuka WhatsApp atau tautan bayar, sedangkan halaman Sengketa admin masih memakai mock.

**Dependensi.** [Portal tenant web](issue-portal-tenant-web.md) menyediakan layout, halaman Pesanan dan Manajemen Akun. Checkout customer dan monitoring admin dapat dikerjakan paralel dengan portal. Gunakan backend dari commit `84aee941` atau merge yang sudah mencakupnya. Terapkan migrasi di database demo dengan `php artisan migrate`. Jalankan `php artisan schedule:work` untuk pencairan otomatis saat UI ditutup.

## Langkah 1 — Checkout dan detail pesanan customer

1. Ubah `jogjahub-web/src/components/customer/ServiceBookingPanel.tsx` dan rute `src/app/(site)/services/[id]/page.tsx`. Pertahankan pilihan layanan tanpa jadwal, slot tunggal, dan check-in/check-out hotel. Ambil harga dan tipe harga dari resource layanan (`price`, `price_type`, `is_accommodation`, `subcategory.requires_time_slot`). Ikuti `BookingService.php`: gunakan `Math.trunc(Number(price))` sebagai harga dasar agar `demo_expected_amount` cocok dengan integer Rupiah di backend. Untuk `per_night`, kalikan dengan jumlah malam, dengan tanggal check-out sebagai batas eksklusif.
2. Di checkout tampilkan **Mode demo · Pembayaran dan pencairan disimulasikan**, pilihan Transfer bank, GoPay, DANA, dan tombol **Simulasikan Pembayaran**. Customer hanya memilih metode. Tawarkan **Ambil sendiri** hanya pada layanan tanpa jadwal dan tanpa check-in/check-out.
3. Panggil `POST /customer/bookings` dengan payload di bawah. Kunci submit dengan ref dan nonaktifkan tombol saat request. Simpan key dan payload yang sama untuk retry ketika hasil request belum diketahui. Key baru dibuat untuk checkout yang berbeda. Bedakan respons 422 yang pasti dari timeout atau gangguan jaringan. Bila perlu, tambahkan status HTTP dan detail validasi pada error dari `src/lib/api.ts` dengan tetap menjaga kompatibilitas pemanggil lama. Untuk 422 harga/jadwal, muat ulang data dan minta konfirmasi sebelum mengirim ulang. Saat berhasil, pindah ke `/dashboard/orders/{data.uuid}` tanpa memakai tautan eksternal dari respons.
4. Tambahkan `src/app/(customer)/dashboard/orders/[uuid]/page.tsx`. Tambahkan tautan dari daftar Pesanan dan Riwayat di `CustomerBookingsPage.tsx`. Detail memuat `GET /customer/bookings/{uuid}`. Tampilkan kode seperti `JH-0001`, nominal dari `total_amount`, layanan, jadwal, status pesanan, pembayaran, dan dana. Gunakan UUID untuk navigasi dan API.
5. Pada pesanan demo `confirmed` atau `awaiting_completion_confirmation`, tampilkan **Laporkan kendala** bila belum pernah dilaporkan. Kirim `POST /customer/bookings/{uuid}/completion-issue` dengan `{ reason }` (maks. 1.000 karakter). Komplain terbuka jika `issue_reported_at` ada dan `issue_resolved_at` kosong. Tampilkan alasan dan `issue_resolution` saat tersedia. Tampilkan **Pesanan diterima** hanya jika status `awaiting_completion_confirmation` dan komplain demo tidak terbuka. Konfirmasi melalui `POST /customer/bookings/{uuid}/confirm-completion`, lalu tampilkan respons terbaru.

Contoh payload checkout untuk layanan tanpa jadwal

```json
{
  "service_id": 12,
  "demo_payment_method": "bank_transfer",
  "demo_checkout_key": "web-checkout-123456789",
  "demo_expected_amount": 100000,
  "demo_pickup": true
}
```

Gunakan `bank_transfer`, `gopay`, atau `dana`. Key sebenarnya unik per checkout dan terdiri dari 16–64 karakter ASCII alfanumerik, tanda hubung, atau garis bawah. Untuk slot tunggal tambah `slot_id`. Untuk hotel tambah `check_in_date` dan `check_out_date`. Kedua bentuk jadwal tersebut saling eksklusif. Gunakan `demo_pickup: false` untuk pesanan terjadwal.

## Langkah 2 — Pemenuhan pesanan dan Pendapatan tenant

1. Pada detail `/vendor/orders/{uuid}`, tampilkan status pembayaran dan status dana di tempat terpisah. Jika `can_mark_fulfilled === true`, panggil `POST /tenant/bookings/{uuid}/mark-fulfilled`. Labelnya **Siap diambil** jika `demo_pickup` benar, atau **Selesai dikerjakan** untuk jenis lain. Pembayaran demo sudah membuat pesanan berstatus `confirmed`. Dana tetap ditahan setelah tenant menyelesaikan pesanan.
2. Buat `/vendor/earnings` dengan tautan **Pendapatan** dari Dashboard. Gunakan `GET /tenant/demo-earnings?page=N` dan render satu baris per UUID, nomor pesanan, `total_amount`, status dana, serta nilai `payment.payout_destination` yang sudah disamarkan oleh backend. Gunakan `meta.current_page` dan `meta.last_page`. Sediakan **Muat ulang** agar status dalam pencairan bisa diperiksa kembali.
3. Tambahkan **Tujuan Pencairan** di Manajemen Akun dengan `GET/PUT /tenant/demo-payout-destination`. Respons berbentuk `{ data: destination | null }` untuk GET. Payload terdiri dari `type` (`bank`, `gopay`, `dana`), `provider` (nama bank wajib untuk `bank`), `number` (string 6–24 digit), dan `holder`. Data contoh yang bisa dipakai adalah BCA, `0000001234`, dan Pemilik Demo. Tampilkan keterangan mode demo di Pendapatan dan form tujuan. Nomor utuh hanya ada di form pemilik.
4. Jika `payment.payout_waiting_for_destination` benar, tampilkan petunjuk dan tautan ke form tujuan. Konfirmasi customer sudah tercatat. Setelah tujuan disimpan, muat ulang Pendapatan untuk melihat proses berlanjut tanpa konfirmasi ulang.

| `payment.fund_status` | Label |
| --- | --- |
| `held` | Ditahan |
| `processing` | Dalam pencairan |
| `simulated` | Pencairan disimulasikan |
| `failed` | Pencairan bermasalah |

Pesanan lama dengan `fund_status` kosong tetap tampil dengan status pembayaran yang tersedia. Gunakan data respons untuk semua transisi dana.

## Langkah 3 — Monitoring Escrow admin

- Ganti data mock di `jogjahub-web/src/app/admin/disputes/page.tsx` dengan `GET /admin/demo-escrow-cases?page=N`. Sajikan detail kasus dan formulir tindakan di daftar. Ganti layar mock `src/app/admin/disputes/[uuid]/page.tsx` dengan redirect ke daftar kasus jika tidak dipakai. Kontrak saat ini menyediakan endpoint daftar, resolve, dan retry.
- Komplain terbuka ditangani melalui `POST /admin/bookings/{uuid}/resolve-completion-issue` dengan `{ resolution }` (maks. 1.000 karakter). Untuk dana `failed` tanpa komplain terbuka, sediakan **Coba lagi pencairan** melalui `POST /admin/bookings/{uuid}/retry-demo-payout`. Jika tenant belum menyimpan tujuan, tampilkan petunjuk untuk tenant. Muat ulang daftar setelah tindakan berhasil.
- Pertahankan guard admin yang ada. Gunakan API helper bersama, tipe booking yang dipakai lintas halaman, dan pesan error dari backend. Tangani loading, kosong, 401/403/422, dan submit berulang. Gunakan komponen yang sudah ada. Bagi PR menjadi checkout customer, escrow tenant, dan monitoring admin bila perlu.

## Kriteria penerimaan

- [ ] Customer web dapat checkout dari detail layanan tanpa pindah ke WhatsApp. Uji layanan tanpa jadwal, slot tunggal, dan hotel beberapa malam. Total hotel berasal dari harga per malam yang dikalikan jumlah malam.
- [ ] Checkout Rp100.000 tampil sebagai satu entri **Ditahan** di Pendapatan. Mengulang submit checkout yang sama menghasilkan UUID yang sama. **Siap diambil** atau **Selesai dikerjakan** belum mengubah status dana.
- [ ] Setelah **Pesanan diterima**, entri yang sama berubah menjadi **Dalam pencairan**, kemudian **Pencairan disimulasikan** saat data dimuat ulang. Tujuan tampil sebagai `BCA •••• 1234`. Mengulang konfirmasi tidak menambah entri.
- [ ] Uji penerimaan saat tenant belum punya tujuan. Dana tetap **Ditahan** dan konfirmasi tersimpan. Setelah tenant menyimpan tujuan, pencairan berlanjut.
- [ ] Komplain customer muncul di daftar admin dan menahan dana. Customer dapat mengonfirmasi penerimaan setelah admin menyelesaikan komplain. Jika fixture payout gagal tersedia, verifikasi percobaan ulang dari admin. Verifikasi role lain mendapat 403 pada tindakan admin.
- [ ] Uji silang web/mobile dengan API dan database yang sama. Pesanan yang dibuat di web terlihat di mobile dan pesanan demo dari mobile terlihat di Pendapatan web untuk tenant yang sama.
- [ ] Jalankan `bun run lint`, `bunx tsc --noEmit`, dan `bun run build` di `jogjahub-web`. Sertakan hasil uji tiga role, bukti tampilan desktop dan seluler, serta skenario yang belum bisa diuji dalam PR.

[Spesifikasi demo](https://github.com/Gabriell550/JogjaHub/blob/84aee941/issue-escrow-pembayaran-demo.md) · [Rute API backend](https://github.com/Gabriell550/JogjaHub/blob/84aee941/jogjahub-backend/routes/api.php) · [Tes backend](https://github.com/Gabriell550/JogjaHub/blob/84aee941/jogjahub-backend/tests/Feature/DemoEscrowTest.php)
