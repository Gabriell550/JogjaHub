# BAB IV. FRONT-END GUIDELINE

## 4.1 Tech Stack

### 4.1.1 Tech Stack User & Vendor (Mobile App)

| No. | Teknologi | Fungsi dalam Aplikasi | Alasan Penggunaan |
|-----|-----------|------------------------|---------------------|
| 1 | React Native | Framework utama untuk membangun aplikasi mobile JogjaHub | Memungkinkan pengembangan aplikasi Android dan iOS menggunakan satu basis kode (cross-platform), sesuai kebutuhan PRD |
| 2 | Expo | Menyediakan environment pengembangan dan mempermudah proses build, testing, serta akses fitur perangkat | Mempercepat pengembangan karena konfigurasi awal lebih sederhana dan cocok untuk target pengembangan selama 3 bulan |
| 3 | TypeScript | Menambahkan sistem tipe data pada kode JavaScript | Membantu mengurangi kesalahan saat pengembangan dan membuat kode lebih terstruktur serta mudah dipelihara |
| 4 | Expo Router | Mengatur navigasi dan perpindahan antarhalaman | Mendukung sistem routing berbasis struktur folder dan mempermudah pengelolaan halaman aplikasi |
| 5 | React Navigation | Menyediakan navigasi seperti Stack Navigation, Tab Navigation, dan Drawer Navigation | Mendukung perpindahan halaman pada dashboard User, Vendor, dan Admin |
| 6 | NativeWind | Mengimplementasikan styling berbasis utility class seperti Tailwind CSS | Mempercepat proses pembuatan antarmuka dan menjaga konsistensi desain |
| 7 | Axios | Menghubungkan aplikasi frontend dengan REST API backend | Mempermudah pengiriman request seperti login, mengambil data vendor, membuat booking, dan mengirim data pembayaran |
| 8 | TanStack Query (React Query) | Mengelola pengambilan, penyimpanan sementara (cache), dan pembaruan data dari API | Membantu meningkatkan performa aplikasi dan mempermudah pengelolaan data vendor, booking, serta transaksi |
| 9 | Zustand | Mengelola global state aplikasi | Digunakan untuk menyimpan data yang digunakan oleh banyak halaman, seperti data pengguna, role, status login, dan data sementara |
| 10 | React Hook Form | Mengelola form input | Mempermudah pembuatan form login, registrasi, booking, profil, dan pendaftaran Vendor |
| 11 | Zod | Melakukan validasi data input | Memastikan data yang dimasukkan pengguna sesuai format sebelum dikirim ke backend |
| 12 | Expo SecureStore | Menyimpan data sensitif secara aman pada perangkat | Digunakan untuk menyimpan token autentikasi atau sesi login |
| 13 | Expo Notifications | Mengirim dan menerima notifikasi push | Mendukung notifikasi booking baru, konfirmasi pembayaran, perubahan status, dan pengingat H-1 |
| 14 | Expo Image Picker | Mengakses galeri atau kamera perangkat | Digunakan untuk mengunggah foto profil, portofolio vendor, dan dokumen verifikasi |
| 15 | Expo Document Picker | Memilih dokumen dari perangkat | Mendukung upload KTP, izin usaha, atau dokumen verifikasi Vendor |
| 16 | React Native Calendars | Menampilkan kalender dan memilih tanggal | Digunakan untuk memilih tanggal booking, jadwal layanan, check-in/check-out hotel, dan ketersediaan vendor |
| 17 | React Native Gifted Chat | Menyediakan komponen antarmuka chat | Mempercepat implementasi fitur komunikasi antara User dan Vendor |
| 18 | React Native Maps / Expo Location | Menampilkan lokasi vendor dan membantu pencarian berdasarkan lokasi | Mendukung pencarian Hotel, Salon, Butik, dan vendor lain berdasarkan lokasi |
| 19 | Firebase Cloud Messaging (FCM) | Mendukung pengiriman notifikasi secara real-time | Digunakan untuk pemberitahuan booking, pembayaran, verifikasi vendor, dan pengingat layanan |
| 20 | ~~Midtrans/Xendit SDK atau WebView Integration~~ *(Out-of-Scope MVP)* | Menampilkan dan memproses pembayaran digital | **Ditunda** — sesuai PRD (BAB I), pembayaran otomatis via payment gateway tidak masuk MVP. Metode pembayaran MVP: transfer manual dengan unggah bukti bayar, atau COD/Pay on Arrival. |

> **Catatan:** Item #20 (payment gateway) dikonfirmasi **out-of-scope** untuk rilis MVP, mengikuti PRD. Baris tetap dicantumkan sebagai referensi roadmap pengembangan berikutnya. Item #17 (React Native Gifted Chat) masih perlu dikonfirmasi ulang, karena PRD menyatakan fitur live chat/direct messaging di dalam aplikasi juga ditiadakan untuk MVP (komunikasi dialihkan ke WhatsApp).

### 4.1.2 Tech Stack Admin (Web Dashboard)

| No. | Teknologi | Fungsi |
|-----|-----------|--------|
| 1 | React.js | Membangun antarmuka Admin Dashboard |
| 2 | TypeScript | Mengurangi kesalahan tipe data dan membuat kode lebih terstruktur |
| 3 | Vite | Menjalankan dan membangun proyek React dengan cepat |
| 4 | CSS | Membuat tampilan dashboard secara cepat dan konsisten |
| 5 | React Router DOM | Mengatur perpindahan halaman Admin |
| 6 | Axios | Menghubungkan dashboard dengan backend |
| 7 | TanStack Query | Mengambil, menyimpan cache, dan memperbarui data dari API |
| 8 | Zustand | Menyimpan data login Admin dan state global |
| 9 | React Hook Form | Mengelola form verifikasi, kategori, promo, dan pengaturan |
| 10 | Zod | Memvalidasi input Admin |
| 11 | TanStack Table | Menampilkan tabel vendor, transaksi, pengguna, dan komplain |
| 12 | Recharts | Menampilkan grafik transaksi dan revenue |
| 13 | React Hot Toast / Sonner | Menampilkan pesan berhasil atau gagal |
