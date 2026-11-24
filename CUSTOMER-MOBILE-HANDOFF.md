# Handoff implementasi customer mobile JogjaHub

Dokumen ini merangkum empat masalah dan keputusan desain untuk implementasi customer mobile. Gunakan bersama [DESIGN.md](DESIGN.md) untuk token visual dan wireframe. Jika tahapan interaksi berbeda, ikuti keputusan terbaru di dokumen ini, terutama untuk tujuan kartu layanan dan pemilihan jadwal. Setelah implementasi, sinkronkan bagian customer di `DESIGN.md` dengan hasilnya.

## Ruang lingkup dan kondisi awal

| Masalah | Kondisi yang ditemukan | Solusi yang dituju |
| --- | --- | --- |
| Pencarian | Pencarian Beranda mengarah ke katalog layanan. Satu toko bisa memiliki banyak layanan dan kategori. | Satu tab Jelajah dengan hasil **Semua**, **Toko**, dan **Layanan**. |
| Akses chat | Chat customer–tenant tersedia dari Detail Vendor dan pintasan Pesan. Chat admin belum terhubung. | Jadikan inbox tenant tab **Pesan** dengan indikator pesan belum dibaca. |
| Detail dan pemesanan | Implementasi Detail Layanan sudah mulai tersedia. Jalur dari kartu atau Profil Toko masih perlu diaudit. Pilihan jadwal saat ini ada di Booking. | Satu tujuan Detail Layanan per kartu, galeri foto, jadwal sesuai layanan, chat toko, dan aksi pemesanan. |
| Foto layanan | Katalog menggunakan URL mentah dari API, Detail Layanan membangun ulang sebagian URL, dan daftar Profil Toko belum merender thumbnail. | Verifikasi data dan akses URL, lalu gunakan penentu URL dan fallback yang konsisten. |

Pertahankan nama dan ID kategori dari backend, alur pembayaran yang sedang berlaku, pembatasan layanan publik, dan tampilan tenant. Periksa perubahan lokal sebelum mengedit karena beberapa file terkait sedang dikerjakan. Gunakan komponen, API, dan token yang sudah ada sebagai titik awal.

## 1. Pencarian toko dan layanan

**Masalah.** Customer yang tahu nama toko perlu cara untuk langsung membuka profilnya. Customer yang mencari kebutuhan seperti “wisuda” perlu membandingkan layanan dari beberapa toko. Satu toko dapat muncul di lebih dari satu kategori dan menawarkan beberapa layanan yang sama-sama relevan.

**Alur dan tampilan.**

- Tab **Jelajah** menyediakan input pencarian, pilihan kategori, dan filter hasil **Semua · Toko · Layanan**. Saat belum mengetik, tampilkan pilihan **Penginapan**, **Beauty & Style**, **Gifting**, dan **Dokumentasi** dengan ikon tempat tidur, palet, hadiah, dan kamera. Gunakan data kategori dari API.
- Pencarian dari Beranda membuka Jelajah dengan kata kunci yang sudah diisi. Ketukan kategori dari Beranda membuka Jelajah dengan ID kategori yang sesuai.
- Di **Semua**, buat dua bagian berjudul **Layanan yang cocok** dan **Toko yang cocok**. Setiap bagian berisi kartu yang bisa digeser horizontal. Sisakan sebagian kartu berikutnya agar cara menggulir terlihat. Untuk pencarian umum, tampilkan layanan terlebih dahulu. Jika kata kunci cocok persis dengan nama toko setelah normalisasi huruf dan spasi, tampilkan toko terlebih dahulu.
- **Lihat semua** beralih ke filter terkait dengan kata kunci dan kategori tetap terpasang. Tab **Toko** dan **Layanan** dapat memakai daftar vertikal dengan pagination agar hasil yang panjang mudah ditelusuri. Sembunyikan bagian yang kosong setelah data selesai dimuat. Jika kedua bagian kosong, tampilkan satu pesan yang jelas.
- Kartu toko berisi logo, nama, lokasi, dan kategori. Tampilkan satu kartu per UUID toko. Kartu layanan berisi foto, nama layanan, nama toko, dan harga. Tampilkan satu kartu per ID layanan. Ketukan membuka **Profil Toko** atau **Detail Layanan** sesuai jenis kartu.

**Untuk implementasi.** Gunakan endpoint layanan publik dengan kata kunci dan kategori yang sudah dipakai `useCatalog`. Untuk hasil toko, cek kontrak API publik yang tersedia. Jika belum ada daftar toko yang mendukung pencarian, tambahkan endpoint pencarian toko dengan paginasi, kata kunci, dan ID kategori opsional. Endpoint peta tidak mencakup toko tanpa koordinat. Menurunkan hasil toko dari halaman pertama layanan juga bisa melewatkan toko yang relevan.

Toko harus berstatus `approved`. Saat filter kategori aktif, toko cocok jika memiliki minimal satu layanan aktif dalam kategori itu. Di hasil **Layanan**, hanya tampilkan layanan yang cocok dengan filter. Dari Profil Toko, customer tetap bisa melihat semua layanan publik toko tersebut. Gunakan status memuat, kosong, dan gagal per jenis hasil. Saat kata kunci berubah, abaikan respons lama agar hasil yang tampil sesuai input terbaru.

Titik awal kode. [Beranda](jogjahub-mobile/src/features/customer/home/screens/HomeScreen.tsx), [Katalog](jogjahub-mobile/src/features/customer/catalog/screens/CatalogScreen.tsx), [hook katalog](jogjahub-mobile/src/features/customer/catalog/useCatalog.ts), [rute backend](jogjahub-backend/routes/api.php).

## 2. Bottom bar dan chat

**Masalah.** Customer perlu menemukan pencarian dan balasan tenant dari tab utama. Inbox tenant sudah ada, sedangkan Pusat Bantuan di Profil masih berupa placeholder.

**Solusi.** Pakai lima tab dalam urutan **Beranda · Jelajah · Pesanan · Pesan · Profil**. Pertahankan dock mengambang bergaya tenant pada iOS dan Android, termasuk footer yang mengisi area aman bawah. Gunakan ikon kalender atau clipboard untuk **Pesanan** dan gelembung untuk **Pesan**. Bedakan aksi pemesanan dari percakapan melalui label dan ikon.

- **Pesan** membuka inbox customer yang sudah ada. Pakai `unread_count` dari API untuk badge. Segarkan badge ketika inbox kembali fokus dan setelah pesan ditandai dibaca. Jika jumlah belum bisa diambil, sembunyikan badge hingga datanya tersedia.
- **Chat toko** di Profil Toko dan Detail Layanan memakai UUID tenant untuk membuka atau memulai percakapan lewat `chatApi.start`. Backend menggunakan pasangan customer–tenant untuk memakai kembali percakapan. Dari Detail Layanan, tawarkan draf yang menyebut nama layanan. Customer dapat mengubahnya sebelum mengirim.
- **Bantuan JogjaHub** dapat menjadi entri tersendiri di Pesan setelah kanal support tersedia. Alur chat tenant yang sudah ada dapat dirilis terpisah dari chat admin.

Titik awal kode. [Navigator tab](jogjahub-mobile/src/navigation/CustomerTabNavigator.tsx), [customer stack](jogjahub-mobile/src/navigation/CustomerStackNavigator.tsx), [ChatInbox](jogjahub-mobile/src/features/shared/chat/ChatInbox.tsx), [ChatRoom](jogjahub-mobile/src/features/shared/chat/ChatRoom.tsx), [chatApi](jogjahub-mobile/src/api/chatApi.ts).

## 3. Detail layanan dan pemesanan

**Masalah.** Kartu yang berbeda dapat membawa customer langsung ke pemesanan, Profil Toko, atau Detail Layanan. Foto, informasi, dan pilihan jadwal jadi sulit ditemukan dalam alur yang konsisten.

**Solusi.** Di Beranda, Jelajah, Katalog, dan Profil Toko, ketukan pada kartu layanan menuju `ServiceDetail({ serviceId })`. Audit aksi foto, judul, CTA pada kartu, dan kaitan antar layar. Jika kartu masih punya tombol **Pesan**, arahkan ke Detail Layanan yang sama atau ganti labelnya menjadi **Lihat detail**. Nama toko di dalam detail tetap menjadi tautan ke Profil Toko.

**Urutan Detail Layanan.**

1. **Galeri.** Tampilkan foto utama dan thumbnail yang dapat digeser bila ada beberapa foto. Jika hanya ada satu foto, tampilkan foto tersebut. Pakai foto utama dari data tenant, lalu urutkan sisanya berdasarkan `sort_order`.
2. **Ringkasan.** Tampilkan nama layanan, subkategori, toko, harga Rupiah dan satuannya, deskripsi, serta jumlah dan nilai ulasan jika ada. Gunakan token oranye JogjaHub, latar oranye muda untuk hero, dan tombol utama oranye. Lihat wireframe dan palet di [DESIGN.md](DESIGN.md).
3. **Ketersediaan.** Gunakan detail layanan dan endpoint slot yang sudah dipanggil oleh Booking. Penginapan memilih check-in dan check-out dengan malam yang tersedia berurutan. Layanan dengan `requires_time_slot` memilih tanggal dan jam. Layanan tanpa slot langsung dapat dipesan. Pisahkan kondisi jadwal memuat, kosong, dan gagal.
4. **Footer.** Tampilkan **Chat toko** sebagai aksi sekunder. Tombol utama **Pilih jadwal** menggulir ke Ketersediaan bila pilihan wajib belum lengkap. Jika sudah lengkap atau layanan tidak butuh jadwal, **Pesan layanan** membuka ringkasan dengan pilihan yang sama. Jika jadwal kosong, tampilkan status yang jelas dan pertahankan akses chat.

**Untuk implementasi.** Ekstrak logika tanggal, slot, dan harga dari `BookingScreen` untuk dipakai ulang. Gunakan `is_accommodation` atau `price_type` untuk mengenali Penginapan dan `subcategory.requires_time_slot` untuk layanan dengan jam. Reset jam atau check-out saat tanggal awal berubah. Gunakan ID layanan, ID slot, dan tanggal yang dipilih sebagai data pemesanan. Harga dan ketersediaan diverifikasi lagi saat melanjutkan, dan backend tetap menjadi sumber validasi akhir. Bila slot sudah terisi, tampilkan pesan lalu arahkan customer kembali memilih jadwal. Pertahankan alur konfirmasi dan metode transaksi yang berlaku. Pelanggan memilih jadwal sekali.

Titik awal kode. [Detail Layanan customer](jogjahub-mobile/src/features/customer/service-detail/screens/CustomerServiceDetailScreen.tsx), [Detail Vendor](jogjahub-mobile/src/features/customer/vendor-detail/screens/VendorDetailScreen.tsx), [Booking](jogjahub-mobile/src/features/customer/booking/screens/BookingScreen.tsx), [Konfirmasi Pesanan](jogjahub-mobile/src/features/customer/booking/screens/BookingConfirmationScreen.tsx), [bookingApi](jogjahub-mobile/src/api/bookingApi.ts).

## 4. Foto layanan tidak tampil

**Temuan.** Tenant menyimpan path foto ke disk publik dan backend membentuk `photos[].full_url`. Katalog memakai `full_url` langsung. Detail Layanan menyesuaikan URL `/storage/` dengan host API. Profil Toko belum menggambar thumbnail layanan. Di workspace saat dianalisis, folder layanan berisi 17 JPG dan `public/storage` terhubung. API mengalami timeout dari workspace sehingga respons dan URL untuk layanan bermasalah belum terverifikasi.

**Diagnosis untuk satu layanan yang bisa direproduksi.**

| Hasil pemeriksaan | Langkah berikutnya |
| --- | --- |
| `photos` kosong pada respons list dan detail | Periksa apakah request unggah tenant mengirim `photos[]` dan resource mengembalikan path foto yang tersimpan untuk ID itu. |
| URL foto berisi `localhost` atau host yang tidak terjangkau HP | Periksa URL aktual yang dihasilkan backend, origin publik aset, dan alamat API yang dipakai perangkat. Untuk server pengembangan, pakai alamat yang dapat dijangkau perangkat. |
| Foto mengembalikan 404 atau respons selain gambar | Cocokkan path DB dengan file pada disk publik, jalur `public/storage`, dan akses file di server tempat aplikasi terhubung. |
| URL dapat dibuka di browser HP, tetapi foto kosong di aplikasi | Bandingkan URL yang dikirim ke komponen gambar, dianalisis dari event `onError`, serta konfigurasi akses HTTP perangkat jika URL memakai HTTP. |

**Perbaikan aplikasi.** Gunakan helper [serviceImage.ts](jogjahub-mobile/src/utils/serviceImage.ts) sebagai titik awal. Samakan aturan untuk kartu, galeri, dan thumbnail Profil Toko. Untuk path relatif atau URL storage lokal, buat URL dari origin yang bisa dijangkau perangkat. Pertahankan URL absolut eksternal yang sah, termasuk query yang diperlukan URL bertanda tangan. Jika foto utama kosong atau gagal, coba foto layanan lain yang tersedia, lalu logo toko bila sesuai, lalu tampilkan placeholder. Reset status gagal saat URL berubah. Verifikasi hasil dari perangkat yang memakai API yang sama.

Titik awal backend. [ServiceResource](jogjahub-backend/app/Http/Resources/ServiceResource.php), [unggahan layanan tenant](jogjahub-backend/app/Http/Controllers/Api/Tenant/ServiceController.php).

## Urutan implementasi

1. **Diagnosis dan perbaiki foto.** Gunakan satu layanan nyata sebagai pembanding di Beranda, Katalog, Detail Layanan, dan Profil Toko.
2. **Satukan Detail Layanan dan pemesanan.** Arahkan tiap kartu ke detail yang sama dan pakai ulang logika jadwal sebelum menambah permukaan pencarian baru.
3. **Bangun Jelajah.** Kerjakan hasil toko dan layanan, filter kategori, dua baris horizontal pada Semua, serta akses dari Beranda.
4. **Tambahkan Jelajah dan Pesan ke dock.** Gunakan inbox yang ada, sambungkan badge, dan pastikan aksi Chat toko memakai percakapan yang sama.
5. **Uji alur dari awal ke akhir.** Jalankan `npm run typecheck` dari `jogjahub-mobile`. Jika mengubah pencarian backend, jalankan pengujian endpoint dengan tenant aktif dan data beberapa kategori. Uji tampilan di ponsel atau emulator, lalu perbarui `DESIGN.md`.

## Kriteria penerimaan

- [ ] Cari “wisuda” di Beranda. Jelajah membuka kata kunci yang sama, baris Toko dan Layanan bisa digeser, dan Lihat semua mempertahankan filter.
- [ ] Toko dengan dua kategori muncul sekali di hasil Toko. Filter Dokumentasi menampilkan layanan Dokumentasi saja. Profil Toko mencantumkan layanan aktif dari kategori lain juga.
- [ ] Bottom bar memuat lima tab. Nama tab terbaca pada layar sempit, footer mengisi safe area, dan konten terakhir tetap bisa digulir hingga terlihat.
- [ ] Dari hasil pencarian dan Profil Toko, ketuk layanan yang sama. Detail dan ID pemesanan sama. Uji foto satu, foto banyak, foto gagal, dan layanan tanpa foto.
- [ ] Uji Penginapan, layanan dengan slot, dan layanan tanpa slot. Periksa harga, jadwal yang sampai ke ringkasan, dan kasus slot habis sebelum konfirmasi.
- [ ] Buka Chat toko dari dua layanan milik tenant yang sama. Keduanya membuka percakapan yang sama, draf bisa diedit, dan badge Pesan berubah setelah percakapan dibaca.
- [ ] Uji pencarian tanpa hasil, API gagal, respons lama yang datang terlambat, dan foto yang gagal dimuat. Setiap kondisi punya tampilan yang jelas dan tindakan lanjutan bila tersedia.
