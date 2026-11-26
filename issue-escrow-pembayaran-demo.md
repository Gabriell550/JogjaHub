# Pembaruan alur pemesanan dan pembayaran JogjaHub

## Tujuan

Ganti tombol **Hubungi via WhatsApp** pada detail tenant di aplikasi customer dengan alur pemesanan dan pembayaran di JogjaHub. Customer memilih layanan, menyelesaikan checkout, dan mengonfirmasi penerimaan melalui detail pesanan. Tenant memproses pesanan dan memantau dana melalui menu **Pendapatan**.

Versi demo memakai simulasi pembayaran dan pencairan tanpa integrasi Xendit. Tampilkan keterangan **Mode demo · Pembayaran dan pencairan disimulasikan** pada checkout dan halaman pencairan. Seluruh nominal adalah data demo dan tidak ada uang yang dipindahkan.

## Alur pesanan dan dana

| Tahap | Tindakan | Status dana yang ditampilkan |
| --- | --- | --- |
| 1. Checkout | Customer memilih layanan dan metode simulasi seperti transfer bank, GoPay, atau DANA, lalu menekan **Simulasikan Pembayaran**. Sistem mengonfirmasi pembayaran demo. | **Ditahan** |
| 2. Pengerjaan | Tenant melihat pesanan yang sudah dibayar, mengerjakannya, lalu menekan **Selesai dikerjakan**. Untuk pesanan ambil sendiri, gunakan **Siap diambil**. | **Ditahan** |
| 3. Penerimaan | Setelah menerima pesanan, customer menekan **Pesanan diterima**. Sistem memulai pencairan ke tujuan yang disimpan tenant. | **Dalam pencairan** |
| 4. Selesai | Sistem menyelesaikan simulasi dan mencatat hasilnya di menu **Pendapatan**. | **Pencairan disimulasikan** |

Kalau customer melaporkan masalah sebelum mengonfirmasi penerimaan, tahan dana sampai masalah ditangani. Admin menangani komplain atau kendala pencairan. Pesanan normal berjalan otomatis setelah konfirmasi customer, tanpa persetujuan manual dari admin atau tenant. Jika customer belum mengonfirmasi penerimaan, dana tetap ditahan.

## Checkout dan tujuan pencairan

- Customer memilih metode pembayaran demo tanpa mengisi nomor rekening atau nomor e-wallet pribadi.
- Tenant menyimpan satu tujuan pencairan melalui pengaturan toko. Untuk bank, gunakan nama bank, nomor rekening, dan nama pemilik. Untuk GoPay atau DANA, gunakan jenis e-wallet, nomor HP terdaftar, dan nama pemilik.
- Gunakan data contoh untuk tujuan pencairan demo. Jika tujuan belum tersedia saat customer mengonfirmasi penerimaan, simpan konfirmasi pesanan, tahan dana, dan tampilkan petunjuk kepada tenant. Setelah tenant menyimpan tujuan dan tidak ada komplain terbuka, sistem melanjutkan pencairan menggunakan konfirmasi yang sudah tercatat.
- Di menu **Pendapatan**, tampilkan nomor pesanan, nominal, dan status dana sejak pembayaran dikonfirmasi. Saat pencairan diproses, tampilkan juga tujuan pencairan yang disamarkan. Setiap pesanan dihitung sekali, sesuai status dana terbarunya.

## Cakupan implementasi

- **Aplikasi customer.** Hapus tombol dan tautan WhatsApp dari alur pemesanan di `VendorDetailScreen.tsx`. Arahkan customer ke pemilihan layanan dan checkout. Sediakan tindakan **Pesanan diterima** pada detail pesanan setelah tenant menandai pesanan selesai atau siap diambil.
- **Aplikasi tenant.** Tampilkan status pembayaran pada pesanan masuk, sediakan tindakan untuk menandai pengerjaan selesai, dan tampilkan perubahan status dana pada menu **Pendapatan** serta detail pesanan.
- **Backend.** Simpan status pesanan dan status dana secara terpisah. Validasi tindakan berdasarkan pemilik pesanan dan perannya. Pastikan satu pesanan hanya dapat memicu satu pencairan, termasuk saat tombol ditekan berulang atau permintaan dikirim ulang.
- **Admin.** Gunakan peran admin untuk menangani komplain dan pencairan bermasalah.

Bagian pemesanan dan pembayaran demo di dokumen ini menjadi acuan pembaruan untuk ketentuan WhatsApp dan metode pembayaran di `prd-jogjahub.md`.

## Kriteria penerimaan demo

Kotak yang ditandai sudah diverifikasi melalui pengujian API. Dua pemeriksaan antarmuka tetap terbuka untuk uji perangkat.

- [ ] Customer dapat memulai checkout dari halaman tenant tanpa diarahkan ke WhatsApp.
- [x] Setelah simulasi pembayaran Rp100.000, API Pendapatan mengembalikan satu entri Rp100.000 dengan status **Ditahan**.
- [x] Setelah tenant menandai pesanan selesai atau siap diambil, status dana tetap **Ditahan**.
- [x] Setelah customer mengonfirmasi penerimaan, sistem memproses satu pencairan dan mengubah entri yang sama menjadi **Pencairan disimulasikan**. Contoh tujuan yang tampil adalah **BCA •••• 1234**.
- [x] Jika ada komplain sebelum konfirmasi penerimaan, dana tetap ditahan sampai masalah ditangani admin.
- [x] Jika tujuan pencairan belum tersimpan, konfirmasi penerimaan tetap tercatat dan pencairan dilanjutkan setelah tenant menyimpan tujuan, selama tidak ada komplain terbuka.
- [ ] Checkout dan pencairan menampilkan keterangan mode demo dan dapat dicoba dengan data contoh tanpa transaksi sungguhan.

## Menjalankan demo

- Jalankan `php artisan migrate` pada database backend demo dan `php artisan schedule:work` untuk memproses pencairan otomatis ketika aplikasi ditutup.
- Gunakan tenant yang sudah disetujui dan layanan aktif dengan harga Rp100.000. Di **Profil → Tujuan Pencairan**, gunakan BCA, nomor contoh `0000001234`, dan nama **Pemilik Demo**.
- Dari sisi customer, buka profil toko, pilih layanan, lalu simulasikan pembayaran. Dari akun tenant, periksa **Dasbor → Pendapatan** dan tandai pesanan selesai atau siap diambil. Kembali ke akun customer untuk menekan **Pesanan diterima**, lalu periksa kembali entri yang sama di Pendapatan.
- Untuk menguji kasus khusus, laporkan kendala dari akun customer dan gunakan **Monitoring Escrow** di akun admin. Uji tujuan kosong memakai tenant yang belum menyimpan tujuan, lalu simpan setelah penerimaan tercatat.
