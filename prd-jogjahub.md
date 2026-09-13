# BAB I. PENDAHULUAN

## 1.1 Latar Belakang

Yogyakarta dikenal luas sebagai kota pelajar dengan jumlah wisudawan yang sangat tinggi di setiap periode wisuda dari berbagai perguruan tinggi, seperti UGM, UNY, UMS, UMY, UAD, dan lainnya. Tingginya jumlah wisudawan yang serentak menciptakan lonjakan permintaan terhadap berbagai kebutuhan pendukung wisuda dalam waktu yang sangat singkat.

Salah satu masalah yang paling dirasakan mahasiswa adalah proses pemesanan jasa kecantikan (makeup, penataan rambut, nail art) yang mengharuskan mereka mengantri sejak dini hari demi mendapatkan slot dari salon atau MUA populer. Selain itu, pemesanan busana wisuda di butik (baik untuk wanita maupun pria) masih dilakukan secara manual dengan mendatangi lokasi langsung tanpa kepastian ketersediaan ukuran atau model yang diinginkan. Di sisi lain, keluarga yang datang dari luar kota untuk menghadiri acara wisuda juga kesulitan mendapatkan informasi penginapan yang terintegrasi dengan lokasi kampus dan jadwal acara. Kebutuhan gifting seperti selempang, plakat, ucapan akrilik standing, dan buket bunga pun umumnya harus dipesan secara terpisah di toko-toko yang berbeda, sehingga menambah waktu dan tenaga yang harus dikeluarkan menjelang hari-H.

Kondisi ini menunjukkan belum adanya platform yang mampu mengkonsolidasikan seluruh kebutuhan wisuda — mulai dari kecantikan dan busana (*Beauty and Style*), penginapan (*Hotel*), hingga hadiah dan kenang-kenangan (*Gifting*) — dalam satu alur pemesanan yang mudah diakses. Di sisi lain, para penyedia jasa, khususnya vendor individu dan usaha kecil seperti MUA freelance, penjahit rumahan, atau florist rumahan, juga menghadapi tantangan dalam menjangkau pasar secara digital dan mengelola jadwal booking mereka secara rapi.

Berdasarkan permasalahan tersebut, dibutuhkan sebuah solusi berupa aplikasi mobile yang dapat mengintegrasikan seluruh kebutuhan wisuda dalam satu platform, sehingga memudahkan mahasiswa/siswa untuk melakukan pemesanan lebih awal tanpa harus mengantri atau mendatangi banyak tempat secara terpisah.

## 1.2 Tujuan

Berdasarkan latar belakang di atas, tujuan dari pengembangan aplikasi JogjaHub adalah sebagai berikut:

1. Merancang dan membangun platform aplikasi mobile yang mengintegrasikan tiga kategori kebutuhan wisuda utama, yaitu **Beauty and Style** (Salon dan Butik), **Hotel**, dan **Gifting**, dalam satu ekosistem pemesanan.
2. Memudahkan mahasiswa/siswa dalam melakukan pemesanan kebutuhan wisuda lebih awal (*pre-order*), sehingga tidak perlu lagi mengantre secara fisik sejak dini hari.
3. Memberikan kepastian jadwal, ketersediaan, dan harga layanan kepada pengguna sebelum hari pelaksanaan wisuda.
4. Membuka peluang bagi penyedia jasa (vendor), baik individu maupun usaha kecil, untuk memperluas jangkauan pasar secara digital serta mengelola jadwal booking mereka dengan lebih terstruktur melalui dashboard khusus.
5. Menyediakan sistem administrasi terpusat yang memungkinkan pengelola platform memverifikasi vendor, memantau transaksi, dan menjaga kualitas layanan secara menyeluruh.

## 1.3 PRD (Product Requirement Document) — JogjaHub

### 1. In-Scope (Fitur yang Pasti Dikerjakan)

Sesuai dengan target MVP dalam batas waktu pengerjaan 3 bulan, fitur-fitur berikut wajib ada dan berfungsi:

| Kode | Fitur | Deskripsi |
|------|-------|-----------|
| a | Sistem Autentikasi & Multi-Role | Registrasi dan login untuk 3 role utama (Customer, Vendor, dan Admin). |
| b | Pendaftaran & Approval Vendor | Vendor dapat mendaftar, melengkapi profil, dan memilih kategori utama, yang kemudian harus melalui proses verifikasi (approval) oleh Admin. |
| c | Kategori & Sub-Kategori Layanan | Pengelompokan vendor ke dalam kategori utama (Penginapan, Beauty & Style, Gifting) beserta fitur filter spesifik di dalam kategori (misal: Beauty & Style difilter menjadi Salon dan Butik; Gifting difilter menjadi Selempang, Akrilik, Florist, Plakat). |
| d | Integrasi Peta Lokasi (Map) | Menampilkan titik lokasi (pinpoint) vendor pada peta interaktif di antarmuka customer untuk memudahkan pencarian jarak. |
| e | Sistem Pemesanan (Booking) | Fitur bagi customer untuk memilih tanggal dan slot waktu khusus (termasuk jam dini hari untuk kebutuhan wisuda) lalu melakukan booking. |
| f | Fitur Live Chat / Direct Messaging | **Ditiadakan** — komunikasi langsung antara customer dan vendor di dalam aplikasi ditiadakan; komunikasi dialihkan melalui kontak eksternal (seperti WhatsApp) yang tertera pada profil vendor. |
| g | Manajemen Pesanan (List Booking & Konfirmasi) | Customer dapat melihat daftar pesanan (list booking), membatalkan pesanan, dan memberikan konfirmasi/ulasan. Vendor dapat melihat daftar pesanan masuk serta melakukan konfirmasi (accept/reject). |
| h | Payment Gateway Otomatis (Midtrans/Xendit/Virtual Account) | **Ditiadakan** — transaksi pembayaran online otomatis ditiadakan; metode pembayaran difokuskan pada sistem manual transfer dengan unggah bukti bayar atau sistem pembayaran langsung di tempat (COD/Pay on Arrival). |

### 2. Out-of-Scope (Fitur yang Ditunda / Tidak Masuk Versi Ini)

Untuk menjaga batas waktu pengerjaan 3 bulan agar tetap realistis, fitur-fitur berikut ditiadakan dari rilis MVP:

a. **Sistem Multi-Bahasa & Multi-Mata Uang** — Aplikasi hanya menggunakan Bahasa Indonesia dan mata uang Rupiah.

b. **Program Loyalitas & Voucher Diskon** — Fitur promo code, kupon, atau sistem poin bagi pelanggan setia ditunda ke pengembangan versi berikutnya.

### 3. Fitur & Kebutuhan Fungsional (Functional Requirements)

Penjelasan modul dan alur interaksi pengguna (*user stories*):

**Modul 1: Manajemen Akun & Autentikasi**
- **FR-01**: Sistem harus menyediakan halaman registrasi terpisah antara Customer dan Vendor.
- **FR-02**: Pengguna dapat masuk (login) menggunakan email dan kata sandi yang terdaftar untuk mengakses hak akses masing-masing.

**Modul 2: Pendaftaran & Approval Vendor**
- **FR-03**: Calon vendor wajib mengisi formulir profil bisnis dan mencentang kategori layanan yang disediakan (Penginapan, Beauty & Style, Gifting).
- **FR-04**: Admin memiliki akses untuk melihat daftar vendor yang berstatus *Pending*, lalu menekan tombol *Approve* atau *Reject*. Vendor yang disetujui akan aktif tampil di katalog aplikasi.

**Modul 3: Pencarian, Kategori, & Peta Lokasi**
- **FR-05**: Customer dapat melihat daftar kategori utama pada halaman utama aplikasi.
- **FR-06**: Ketika Customer memilih kategori (misal: Beauty & Style), sistem menampilkan sub-kategori beserta fitur filter lanjutan (Salon atau Butik).
- **FR-07**: Sistem menampilkan visualisasi peta (Map) yang memuat titik lokasi toko/vendor di sekitar wilayah Yogyakarta.

**Modul 4: Pemesanan (Booking) & Manajemen Pesanan**
- **FR-08**: Customer dapat memilih produk/layanan vendor, menentukan tanggal, dan memilih slot waktu khusus (termasuk jam dini hari).
- **FR-09**: Sistem mencatat data pesanan ke dalam menu *List Booking* milik Customer dengan status awal *Pending*.
- **FR-10**: Vendor menerima notifikasi pesanan masuk di dashboard mereka dan dapat mengubah status pesanan menjadi *Confirmed* atau *Cancelled*.
- **FR-11**: Customer dapat melakukan pembatalan pesanan melalui menu *List Booking* apabila memenuhi syarat ketentuan waktu.

### 4. Kebutuhan Non-Fungsional (Non-Functional Requirements)

**a. Aspek Performa**
Waktu muat (*load time*) halaman utama dan katalog produk maksimal 3 detik pada jaringan internet standar.

**b. Aspek Keamanan (Security)**
- Enkripsi kata sandi menggunakan algoritma *hashing* yang aman (misal: Bcrypt).
- Penerapan otorisasi berbasis peran (*Role-Based Access Control* / RBAC) agar customer tidak dapat mengakses halaman khusus vendor atau admin.

**c. Aspek Skalabilitas**
Arsitektur basis data dirancang secara modular agar mudah ditambah tabel atau relasi baru jika di kemudian hari fitur pembayaran otomatis atau chat ingin diintegrasikan.

**d. Kapasitas Penyimpanan**
Menggunakan database relasional dengan kapasitas awal yang dioptimalkan untuk menampung data teks pengguna, vendor, dan histori booking skala menengah.

**e. Kompatibilitas Perangkat**
Antarmuka harus bersifat *responsive* (dapat diakses dengan baik melalui smartphone, tablet, maupun komputer/laptop via browser) & native.

### 5. Asumsi, Keterbatasan, & Risiko (Assumptions & Constraints)

**a. Batasan Waktu & Sumber Daya**
Proyek harus diselesaikan dalam batas waktu ketat yaitu 3 bulan, sehingga fokus mutlak diberikan pada fitur inti MVP di atas.

**b. Batasan Teknologi**
Mengandalkan integrasi peta pihak ketiga (seperti Leaflet.js atau Google Maps API versi gratis/standar) untuk pemetaan lokasi vendor di Yogyakarta.

**c. Asumsi Pengguna**
Diasumsikan bahwa vendor memiliki akses internet yang stabil untuk memantau pesanan masuk dan customer memahami cara melakukan booking secara mandiri secara online.

**d. Potensi Risiko & Mitigasi**
- **Risiko**: Vendor lambat merespons pesanan dini hari atau terjadi penumpukan booking di jam yang sama.
- **Mitigasi**: Pembatasan kuota slot waktu (*slot capacity*) per jam pada sistem booking vendor dan pencantuman instruksi jelas pada dashboard vendor.

## 1.4 Use Case Diagram

*(Gambar 1. Use Case Diagram JogjaHub)*

Berdasarkan use case diagram tersebut, sistem melibatkan tiga aktor:

- **User** (pencari layanan) — dapat mendaftar, mencari dan booking vendor, melakukan pembayaran, mengelola pesanan, serta berinteraksi via chat atau WhatsApp.
- **Vendor** (penyedia layanan) — mendaftar dengan persetujuan admin, mengelola listing layanan, mengatur jadwal, memproses pesanan, serta berinteraksi dengan user dan admin.
- **Admin** — bertugas memverifikasi pendaftaran vendor baru serta memantau seluruh aktivitas transaksi, user, dan tender secara real-time.
