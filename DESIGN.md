# JogjaHub · Desain mobile tenant dan customer

**Baseline implementasi** [PR #84 · add tab navigator motion](https://github.com/Gabriell550/JogjaHub/pull/84), commit `105e87325a9be9425f6131ca480c3b3f5945dc5e` pada `mobile-app`. Gunakan baseline tersebut untuk implementasi karena sudah memuat Rubber Dock. Dokumen ini menjadi spesifikasi untuk perubahan UI berikutnya.

## Ruang lingkup

- Redesign isi `Dashboard → DashboardHome` untuk tenant yang disetujui di aplikasi iOS dan Android. Dock merupakan bagian navigator tenant sehingga tampil konsisten pada kelima tab, termasuk saat membuka layar turunan. Layar tujuan mempertahankan isi dan gayanya.
- Perubahan yang diizinkan meliputi susunan komponen, tata letak, token lokal, copy presentasi, styling, ukuran area sentuh, label aksesibilitas, dan penempatan dock serta lapisan animasi. Pertahankan pengaturan orientasi portrait dan tema aplikasi yang ada.
- Pertahankan identifier, urutan, parameter, handler navigasi, event tab dan state stack, serta seluruh logika dashboard, sumber data, endpoint, bentuk request/response, otorisasi, izin perangkat, Redux, dan penyimpanan lokal. `RootNavigator` tetap menormalisasi role `tenant` ke `vendor` dan membatasi `VendorTabNavigator` ke `tenantStatus === 'approved'`.
- Bagian dashboard ini mencakup tenant native. Implementasi customer didokumentasikan pada bagian Desain customer mobile. Admin, auth/onboarding, Expo Web, web JogjaHub, backend, dan konfigurasi lingkungan berada di luar cakupan desain.

## Baseline yang ditinjau

| Area | Implementasi pada head PR #84 |
| --- | --- |
| Dashboard | `VendorDashboardStackNavigator` mengarah ke `VendorDashboardScreen` untuk `DashboardHome`. Header gelap berada di luar `ScrollView`. Kartu saldo oranye, performa, pintasan, layanan, notifikasi pesanan baru, dan pratinjau pesanan sudah tersedia. |
| Dock | `VendorTabNavigator` dan `CustomerTabNavigator` memakai `RubberDockTabBar`. Lebar tertutup dihitung dari tab 56 dp dengan gap 4 dp dan padding 6 dp per sisi, sehingga lima tab tenant menjadi 308 dp sebelum pembatasan lebar layar. Panel terbuka menuju 340 dp. Footer berwarna `colors.surface` dan memakai `max(insets.bottom, 8)`. Lebar, pergeseran horizontal, dan tinggi permukaan berubah saat animasi. |
| Perubahan PR | Lima file berubah. `VendorTabNavigator.tsx` dan `CustomerTabNavigator.tsx` memasang dock bersama. `RubberDockTabBar.tsx` dan `useRubberDockMotion.ts` menambahkan panel, gestur, dan animasi. Perubahan alamat LAN di `src/constants/config.ts` independen dari desain. `VendorDashboardScreen.tsx` tidak termasuk diff. |
| Stack dan konvensi | Manifest mobile pada commit acuan mencantumkan Expo `^58.0.19`, React Native `0.88.0`, React `19.3.0`, TypeScript `~6.0.3`, React Navigation v6, Redux Toolkit, Lucide, dan `react-native-safe-area-context`. README mobile masih menyebut SDK 54. Ikuti manifest. Tata letak memakai `StyleSheet`, token di `src/constants/theme/`, dan font yang telah dimuat di `App.tsx`. |

## Arah visual dan hierarki

Referensi memperlihatkan header gelap, satu kartu hijau sebagai fokus, permukaan bawah yang hangat, kartu putih ringkas, dan dock terang yang dekat dengan indikator home. Terapkan hierarki tersebut dengan identitas JogjaHub, aksen oranye untuk aksi, foto layanan yang sudah tersedia, dan konten operasional tenant.

~~~text
VendorTabNavigator
  Dashboard → DashboardHome → VendorDashboardScreen
    VendorHeaderBar                                          tetap di atas pada ukuran standar
      Logo JH / JogjaHub
      Selamat Datang, / nama usaha / status toko
    ScrollView + RefreshControl                              scroll vertikal utama
      SaldoTokoCard                                          kartu estimasi, mata, aksi
      QuickActionsGrid                                       alat tenant
      PerformaCard                                           pendapatan dan grafik
      MyServicesSection                                      kartu layanan horizontal
      OrderNotificationCard                                  saat ada pesanan baru
      Pesanan masuk → OrderPreviewCard × jumlah yang ada
  RubberDockTabBar (varian tenant)
    Footer hangat selebar layar
      Permukaan putih mengambang
        Panel pintasan                                       saat terbuka
        Lima tab                                             selalu di bawah panel
      Area aman bawah                                        permukaan hangat menyambung
~~~

### Wireframe pada lebar 390 dp

~~~text
┌────────────────────────────────────────────────┐
│ JH  JogjaHub                                   │ navy + safe area atas
│ Selamat Datang,                                │
│ Nama usaha                       Toko Buka     │
│ ┌───────────────────────────────────────────┐  │
│ │ Estimasi Pendapatan · Data contoh         │  │ hero hijau, transisi ke canvas
│ │ Rp4.250.000                          Mata │  │
│ │     Tarik       Riwayat       Pesanan     │  │
│ └───────────────────────────────────────────┘  │
│ [Produk Anda] [Dompet] [Statistik] [Ulasan]    │ canvas hangat, scroll vertikal
│ Pendapatan Hari Ini                            │
│ Layanan Saya                      Lihat Semua  │
│ Pesanan Baru / Pesanan masuk                   │
│ ╭───────────────────────────────────────────╮  │
│ │ Dasbor  Layanan  Kalender  Pesanan  Profil│  │ lima slot setara
│ ╰───────────────────────────────────────────╯  │
│           area aman bawah terisi               │
└────────────────────────────────────────────────┘
~~~

### Ukuran dan token

Ukuran menggunakan dp React Native. Terapkan token yang sudah ada melalui `src/constants/theme/`. Pusatkan nilai warna tambahan untuk tenant dashboard/dock di satu modul token yang diimpor oleh keduanya. Pertahankan nilai token global.

| Peran | Nilai | Pemakaian |
| --- | --- | --- |
| Header / teks | `colors.navy` / `colors.onNavy` / `colors.navySub` | Header, judul, sapaan |
| Canvas dan footer | `#FAF7F2` | Latar konten, sela luar dock, dan area di bawah dock |
| Permukaan kartu | `colors.surfaceContainerLowest` | Kartu sekunder, panel, dan dock |
| Garis pemisah | `#E6DED4`, 1 dp | Tepi kartu/dock dan pemisah dekoratif |
| Kartu estimasi | `#0B5D48` / `colors.onNavy` / `#D4F3E8` | Latar hijau, nilai utama, teks sekunder dan aksi nonaktif |
| Teks isi / sekunder | `colors.onSurface` / `colors.onSurfaceVariant` | Judul, harga, metadata, tab nonaktif |
| Aksi / tab aktif | `colors.primary` / `colors.onPrimary` | Tautan pada latar terang, indikator tab dan isinya |
| Status dan badge | `#1F6426` pada `colors.accentGreenContainer`, `colors.onPrimaryFixedVariant` pada `colors.primaryFixed`, `colors.onTertiaryFixedVariant` pada `colors.tertiaryFixed` | Positif, TERBARU, DIPROSES. Selalu sertakan teks. |
| Jarak | Gutter 16/20, jarak kartu 16, jarak antarseksi 24, jarak elemen 4/8/12 | Gutter 16 pada lebar aman <360, 20 mulai 360 |
| Radius | Permukaan bawah/hero 24, kartu 16, thumbnail 12, dock 24, indikator 20, chip penuh | Gunakan `radius` yang tersedia untuk 12/16/24 dan chip |
| Bayangan | Kartu sekunder elevasi 0, hero elevasi 2, dock elevasi 4. Dock setara `0 4px 14px rgba(18,28,42,0.12)`. | Gambar bayangan pada wrapper luar. Klip isi pada permukaan dalam. |

| Teks | Token / ukuran dasar |
| --- | --- |
| Nama usaha | `headlineLgMobile`, 20/28, Lexend SemiBold |
| Nilai estimasi | `headlineXl`, 32/40, Lexend Bold. Pada lebar aman <360, gunakan 28/36. |
| Judul seksi | `titleMd`, 18/24, Lexend SemiBold |
| Isi / metadata | `bodyMd` 14/20 / `bodySm` 12/16, Inter Regular |
| Aksi / label tab | `labelMd` 12/16 / `labelSm` 11/16, Inter Medium. Pertahankan scaling sistem. |

### Layout per bagian

1. **Header.** `VendorHeaderBar` memiliki padding atas `insets.top + 12` dan padding bawah 16. Tampilkan brand dengan kotak JH 32 × 32, lalu sapaan dan nama usaha dari Redux dengan fallback `Vendor`. Letakkan status di kanan nama bila muat. Pada lebar aman <360 atau `fontScale > 1.3`, letakkan chip status di baris berikutnya dengan jarak 8. Nama usaha boleh membungkus. Jika tinggi scene tertutup <560 dp atau `fontScale > 1.3`, tempatkan header sebagai blok pertama di scroll yang sama agar konten tetap terjangkau. Pertahankan latar navy pada area status sistem dan hitung inset atas sekali. Kontrol status minimal 48 dp dengan teks `Toko Buka` atau `Toko Tutup`. Gunakan latar hijau pucat dengan teks hijau tua saat buka, dan latar putih transparan dengan teks putih saat tutup. Pada dashboard saat ini, bell dan avatar tidak diberi handler. Sembunyikan kedua affordance dan dot dekoratifnya pada pemakaian ini.
2. **Kartu estimasi.** Mulai scroll dengan `SaldoTokoCard`. Teruskan latar navy sejauh 32 dp ke dalam scroll sebagai lapisan di belakang kartu, lalu tampilkan permukaan canvas dengan sudut atas 24 dp. Kartu hijau mulai pada y=0 relatif terhadap awal scroll, memakai gutter halaman, radius 24, padding 16, dan sela 8–12. Gunakan `Estimasi Pendapatan` sebagai label untuk nilai yang sudah dipakai komponen, dengan keterangan `Data contoh`. Pertahankan pemformatan Rupiah `id-ID` dan tombol mata di samping nominal. Di bawahnya susun tiga aksi setara lebar dalam urutan `Tarik`, `Riwayat`, `Pesanan`. Dua aksi pertama tampil nonaktif. Sembunyikan panah detail yang belum mempunyai handler. Ikon aksi 20 dp, lingkaran 44 dp, area tekan aktif minimal 48 dp.
3. **Pintasan.** Letakkan `QuickActionsGrid` 16 dp setelah hero. Empat tile putih berukuran setara dengan jarak 8 dp, padding 8, tinggi minimum 80 dp dan ikon 40 dp berisi glyph 20 dp. Urutan `Produk Anda`, `Dompet`, `Statistik`, `Ulasan`. `Dompet` dan `Ulasan` tampil nonaktif dengan teks terbaca. Pada lebar aman <360 atau `fontScale > 1.3` gunakan 2 × 2. Label boleh membungkus.
4. **Performa.** Letakkan `PerformaCard` 16 dp setelah pintasan, dalam satu kartu putih dengan padding 16. Tampilkan judul `Pendapatan Hari Ini`, penanda `Data contoh`, nominal, indikator pertumbuhan, jumlah selesai, grafik jam, waktu puncak, rata-rata per pesanan, dan `Lihat Analisis`. Gunakan bar yang sudah ada, sisakan ruang plot minimum 72 dp, dan sorot puncak dengan warna serta teks. Metadata dan aksi pindah baris saat sempit. Pertahankan fallback `Belum ada data penjualan` untuk seri kosong.
5. **Layanan Saya.** Mulai 24 dp setelah performa. Judul dan `Lihat Semua` berada di baris yang sama bila muat. Pertahankan daftar horizontal dengan gap 8 dan semua kartu bisa digulir sampai tuntas. Untuk lebar konten terukur `C`, lebar kartu `clamp((C - 32) / 2, 128, 200)`. Pada ponsel, tiga layanan atau lebih biasanya memperlihatkan sisi kartu berikutnya. Kartu putih berisi foto 4:3, nama hingga dua baris pada skala biasa, dan harga Rupiah. Pakai `ServicePhoto` beserta placeholder yang ada. Jika kosong, tampilkan kartu `Belum ada layanan` dengan CTA `Tambah Layanan`. Selama pemuatan awal, ikuti kondisi yang ada dan sembunyikan seksi. Jika gagal, pertahankan toast serta hasil render dari state yang sudah dimiliki.
6. **Pesanan Baru dan Pesanan masuk.** Beri jarak 24 dp antarblok yang benar-benar tampil. `Pesanan Baru` memuat jumlah pesanan belum dilihat, `Tandai Dilihat`, dan seluruh baris notifikasi dari sumber yang ada. Hilangkan blok beserta jaraknya saat kosong. `Pesanan masuk` selalu mengikuti, dengan `Lihat Semua` dan semua kartu pratinjau dalam urutan sekarang. Gunakan kartu putih, ikon 40 dp, harga, metadata, status teks, dan penanda `Data contoh` untuk kedua blok pesanan mock. Label status boleh pindah ke baris berikutnya. Baris notifikasi membuka detail, sedangkan kartu pratinjau dan badgenya bersifat informatif. Beri padding akhir scroll 16 dp.

Pada lebar aman ≥600 dp, pusatkan kolom dashboard dengan lebar maksimum 560 dp dan pertahankan urutan vertikal. Header dan canvas tetap membentang selebar layar. Hitung lebar kartu dari kontainer yang terukur dan respons terhadap perubahan dimensi. Pada ukuran teks besar, utamakan wrap dan tinggi konten intrinsik untuk teks, harga, header kartu dan CTA. Pertahankan scroll utama vertikal serta scroll horizontal khusus daftar layanan.

### Pemetaan aksi dan data yang harus dipertahankan

| Kontrol / data | Perilaku yang dipertahankan dari baseline |
| --- | --- |
| Nama dan status toko | `state.auth.businessName` dan `isOpen` lokal yang awalnya `true`. Handler yang ada mengganti state lokal. |
| Nominal hero | `MOCK_SUMMARY.estimatedRevenue`. Tombol mata memakai `hidden` lokal dengan default terlihat. Saat disembunyikan, tampilan dan pembaca layar menerima status tersembunyi tanpa nominal. |
| Aksi hero `Pesanan` dan `Lihat Semua` pesanan | Handler yang ada memanggil `navigate('Orders')`. |
| `Produk Anda` / `Statistik` / `Lihat Analisis` | `Produk Anda` memanggil `navigate('Listing')`. Kedua aksi analisis memanggil `navigate('Statistics')`. |
| Layanan | `MyServicesSection` memanggil `vendorApi.listMyServices()` (GET `/tenant/services`) melalui `useFocusEffect`. Pertahankan pembacaan bentuk array atau respons berpaginasi yang sudah ditangani. `Lihat Semua` → `Listing → ServicesList`. CTA tambah → `Listing → ServiceForm` dengan `{ mode: 'create' }`. Tap kartu → layar yang sama dengan `{ mode: 'edit', service }` dan objek layanan saat ini. |
| Performa, pesanan dan refresh | Pertahankan `MOCK_SALES_ACTIVITY` dan `MOCK_ORDERS`, termasuk filter pending belum dilihat dan urutan pratinjau. `RefreshControl` memakai handler yang sama dan menyelesaikan refresh setelah 800 ms. |
| Buka notifikasi pesanan | `handleOrderPress` menandai pesanan telah dilihat, lalu menuju `Orders → OrderDetail` dengan parameter lengkap yang sudah dibentuk, yaitu `id`, `order_code`, `service_name`, `customer_name`, `customer_location`, `price`, `status`. |
| Tandai dilihat | `handleMarkAllViewed` tetap memakai `orderTracking.markMultipleAsViewed`. Pertahankan key AsyncStorage `@jogjahub:viewed_orders` serta perilaku baca dan tulis yang ada. |
| Kontrol tanpa tujuan | `Tarik`, `Riwayat`, `Dompet`, dan `Ulasan` yang saat ini no-op dipresentasikan sebagai nonaktif. Saldo, status toko, dan pesanan tetap menggunakan sumber masing-masing. |

## Dock tenant mengambang

### Posisi dan ukuran

Gunakan custom tab bar yang tetap mengambil ruang di bawah scene navigator. Bentuk kapsul putih, bayangan, dan margin samping menghasilkan kesan mengambang. Isi seluruh footer hingga tepi viewport dengan canvas hangat, termasuk area indikator home atau bilah gestur. Latar footer ada di belakang kapsul dan area bawahnya. Area aman bersifat dekoratif. Pertahankan akses ke gestur sistem.

| Ukuran | Rumus / aturan |
| --- | --- |
| Lebar aman `A` | Lebar footer aktual dikurangi `insets.left + insets.right`. Pusatkan dock di tengah lebar aman, sehingga inset asimetris tetap benar. |
| Margin luar `M` | 8 dp jika `A < 360`, 12 dp mulai 360. Jika lebar aman terlalu kecil untuk slot 48 dp, gunakan aturan sempit di bawah tabel. |
| Lebar kapsul `D` | `min(A - 2 × M, 560)`, sama saat panel tertutup atau terbuka. |
| Padding dan gap | Padding kapsul `P = 6` dp per sisi horizontal dan 6 dp per sisi vertikal. Gap tab `G = 4` dp. |
| Lebar row dan slot | `R = D - 2 × P`. Dengan `N = state.routes.length`, `T = (R - G × (N - 1)) / N`. Semua slot sama lebar termasuk Kalender. |
| Tinggi tertutup | Row minimal 56 dp, bertambah sesuai tinggi label yang terukur. Kapsul minimal 68 dp. Ikon 20 dp, jarak ikon ke label 2 dp. |
| Footer bawah | `paddingTop = 8`, `paddingBottom = insets.bottom + 8`. Tinggi footer tertutup minimal `84 + insets.bottom`. |
| Panel terbuka | Tambahkan tinggi panel aktual di atas row pada kapsul yang sama. Batas tinggi panel `min(300, 0.4 × window.height, max(0, usableHeight - closedFooterHeight - 48))`. `usableHeight` adalah tinggi host navigator tenant yang tersedia untuk scene dan footer. Gunakan scroll panel saat konten melebihi batas. |

Jika rumus standar menghasilkan `T < 48` dan area aman memberi ruang untuk lima slot 48 dp, pakai `M = 0`, `G = 0` dan `P = min(6, (A - 48 × N) / 2)`. Padding vertikal tetap 6 dp.

Dengan inset samping nol dan skala teks standar, lebar 320 menghasilkan kapsul 304 dan slot 55,2. Lebar 390 menghasilkan kapsul 366 dan slot 67,6. Pada 390 dengan inset bawah 34, footer tertutup 118 dp dan tepi bawah kapsul 42 dp dari batas bawah aplikasi.

Terapkan inset bawah sekali di footer. Scene yang berakhir tepat di atas footer cukup memakai padding akhir konten normal, tanpa menambahkan tinggi dock atau inset bawah yang sama lagi. Pertahankan kebijakan keyboard/sistem yang saat ini dipakai masing-masing layar. Verifikasi field dan CTA form tetap bisa dijangkau ketika keyboard tampil.

### Tab, panel, dan animasi

| Route | Label / ikon | Aksi panel yang sudah ada |
| --- | --- | --- |
| `Dashboard` | Dasbor / `LayoutDashboard` | `Aktivitas terbaru` → `Dashboard → RecentActivity`, `Statistik bisnis` → `Dashboard → Statistics` |
| `Listing` | Layanan / `Store` | `Tambah layanan` → `Listing → ServiceForm` dengan `{ mode: 'create' }` |
| `Calendar` | Kalender / `Calendar` | `Kelola layanan` → `Listing → ServicesList` |
| `Orders` | Pesanan / `ClipboardList` | `Buka kalender` → `Calendar` |
| `Profile` | Profil / `User` | `Edit profil bisnis` → `Profile → EditBusinessProfile`, `Pesan pelanggan` → `Profile → VendorChatInbox` |

- Pertahankan `state.routes` sebagai sumber urutan dan `state.index` sebagai sumber tab terpilih. Tap tab lain menavigasi dengan dispatch bertarget yang ada setelah `tabPress`, termasuk penghormatan `defaultPrevented`. Tap ulang tab aktif membuka/menutup panel. Bila panel terbuka dan pengguna beralih tab, konten panel mengikuti tab aktif. Long press tetap mengirim `tabLongPress`. Pertahankan semua deskripsi, callback, tombol tutup, dan penanganan Android Back saat panel terbuka. Aksi panel tetap menutup panel sebelum navigasi.
- Pertahankan gestur geser, rubber band, dan animasi indikator dari `useRubberDockMotion`. Tahan posisi kapsul, row, dan hitbox pada sumbu horizontal. Gunakan nudge dan stretch pada indikator dekoratif di dalam batas row. Pada posisi diam, indikator mengisi satu slot. Gunakan warna kontras dari layer aktif dan sembunyikan salinan label/ikon di layer tersebut dari hit test dan pembaca layar.
- Hitung posisi geser dari asal row dalam koordinat window yang diukur dari layout aktual. `firstCenter = rowLeftInWindow + T / 2` dan `pitch = T + G`. Gunakan angka yang sama untuk indikator dan pemetaan geser ke indeks. Perbarui ukuran saat viewport, inset, atau font scale berubah. Saat panel beranimasi, row tetap dekat safe area dan panel tumbuh ke atas. Panel, label tab, dan tombol tidak boleh terpotong ketika grafik indikator bergerak. Batasi penambahan tinggi sampai ukuran panel yang tersedia, termasuk saat spring overshoot.
- Pertahankan dukungan Reduce Motion. Saat aktif, terapkan posisi dan tinggi akhir tanpa stretch, pop atau animasi buka/tutup. Tap, geser, panel, dan aksi tetap dapat digunakan. Saat panel tertutup atau belum terlihat, keluarkan isinya dari focus traversal dan hit test.

### Aksesibilitas dan feedback

- Target sentuh aktif minimum 48 × 48 dp. Pertahankan `accessibilityRole="tab"`, state `selected` dan `expanded`, hint panel pada tab aktif, dan test ID dock yang ada. Label tab tetap terlihat. Saat teks sistem membesar, izinkan label membungkus dalam slot dan naikkan tinggi seluruh row mengikuti label tertinggi. Label aksesibilitas tetap memakai nama lengkap, termasuk saat label visual membungkus.
- Gunakan `accessibilityRole="header"` untuk judul seksi dan `button` untuk CTA. Untuk status toko gunakan peran switch, label `Status toko` dan state `checked: isOpen`. Untuk mata gunakan label aksi `Sembunyikan estimasi pendapatan` atau `Tampilkan estimasi pendapatan` sesuai state. Umumkan keterangan saldo tersembunyi tanpa menyertakan nilai.
- Tombol tanpa tujuan memakai presentasi dan state disabled dengan label yang terbaca. Kontrol aktif punya feedback pressed dan indikator fokus yang terlihat. Gunakan `colors.tertiary` untuk outline fokus pada latar terang dan putih pada latar gelap. Target kontras WCAG AA 4,5:1 untuk teks biasa serta 3:1 untuk indikator/fokus dan ikon fungsional. Status toko, pesanan, dan seleksi tab memiliki teks atau state semantik sebagai pendamping warna.
- Urutan fokus dashboard mengikuti hierarki visual. Sembunyikan ikon dekoratif dari pembaca layar. Gunakan label kontekstual untuk `Lihat Semua Layanan` dan `Lihat Semua Pesanan`. Ringkas grafik sebagai satu elemen aksesibel dengan informasi pertumbuhan, jumlah selesai, waktu puncak, dan rata-rata yang sudah tersedia. Pastikan tombol tutup dan tiap aksi panel dapat difokuskan. Setelah menutup panel tanpa navigasi, kembalikan fokus ke tab aktif bila fokus sebelumnya berada dalam panel.

## Implementasi yang disarankan

1. Atur ulang blok UI, permukaan, jarak, dan padding scroll. Pakai komponen, callback, serta state yang sudah ada. [VendorDashboardScreen](jogjahub-mobile/src/features/vendor/dashboard/screens/VendorDashboardScreen.tsx) · [Komponen dashboard](jogjahub-mobile/src/features/vendor/dashboard/components)
2. Tambahkan token khusus tenant. Gunakan komponen gambar dan ikon yang sudah dipakai proyek. [Theme](jogjahub-mobile/src/constants/theme)
3. Pilih varian tenant di navigator dan batasi perubahan shared dock ke cabang presentasi varian tersebut. Pakai kembali hook animasi, urutan route, serta pemetaan aksi yang ada. [VendorTabNavigator](jogjahub-mobile/src/navigation/VendorTabNavigator.tsx) · [RubberDockTabBar](jogjahub-mobile/src/navigation/RubberDockTabBar.tsx) · [useRubberDockMotion](jogjahub-mobile/src/navigation/useRubberDockMotion.ts)

Rujukan implementasi. [React Navigation v6 · Bottom Tabs Navigator](https://reactnavigation.org/docs/6.x/bottom-tab-navigator/), [React Native 0.88 · useWindowDimensions](https://github.com/react/react-native-website/blob/main/website/versioned_docs/version-0.88/usewindowdimensions.md).

## Kriteria penerimaan

- [ ] Jalankan `npm run typecheck` dari `jogjahub-mobile`. Diff implementasi terbatas pada presentasi DashboardHome, token khusus tenant, dan presentasi dock tenant.
- [ ] Tinjau lebar 320, 360, 390, 430, dan ≥600 dp. Uji kombinasi iOS dengan home indicator, Android gestur dan 3 tombol, serta inset bawah nol dan asimetris kiri/kanan. Kapsul rata tengah pada lebar aman, semua tab tampil, area bawah menyatu dengan footer, dan scroll terakhir berhenti dengan jarak 16 dp dari footer.
- [ ] Uji dock pada kelima tab dan layar turunan, termasuk input ber-keyboard. Ketuk, ketuk ulang, long press, geser, buka/tutup panel, jalankan setiap pintasan panel, dan gunakan Android Back saat panel terbuka. Pastikan hitbox tab stabil, panel terbuka ke atas, dan tidak ada lompatan atau clipping pada transisi.
- [ ] Uji Reduce Motion, VoiceOver/TalkBack, dan teks sistem besar (minimal ~200% bila perangkat mendukung), termasuk layar 320 dp, nama usaha panjang, dan nominal Rupiah panjang. Pastikan target aktif 48 dp, indikator fokus terbaca, dan label atau aksi tidak hilang saat wrap. Nominal tersembunyi tidak dibaca.
- [ ] Uji toggle toko, mata, refresh, layanan loading/kosong/berisi/foto gagal/API gagal, grafik kosong, pesanan baru kosong/berisi, detail dan tandai dilihat. Pastikan perubahan status baca bertahan setelah reload sesuai perilaku saat ini.
- [ ] Verifikasi tujuan tab tenant dan perilaku role admin, tenant pending/rejected, serta Expo Web.

## Asumsi dan batas verifikasi

Arah visual berasal dari gambar `image(3).png` yang diberikan bersama brief. Pemilihan hijau gelap, canvas hangat, urutan seksi, dan batas dimensi di atas adalah keputusan desain usulan. Audit baseline dilakukan dari source dan diff pada commit acuan. Pengukuran visual serta perilaku iOS dan Android masih perlu diverifikasi ketika spesifikasi diimplementasikan. Data contoh dashboard, kontrol dompet/ulasan, dan status toko lokal adalah kondisi yang sudah ada.

## Desain customer mobile

Beranda menggunakan kanvas krem hangat dan hierarki visual dari referensi. Header menampilkan merek JogjaHub, lokasi Yogyakarta, dan tombol notifikasi. Kolom pencarian berada di atas hero hijau “Wisuda Besok?”, diikuti kategori, rekomendasi vendor yang bisa digeser, dan peta Yogyakarta. Foto tetap berasal dari data vendor. Hero menggunakan bidang warna dan aksen lingkaran agar teks tetap terbaca.

| Elemen | Implementasi |
| --- | --- |
| Warna | Kanvas '#FAF7F2' dan garis '#E6DED4' berbagi token tenant. Hero hijau '#0B5D48', judul navy, permukaan kartu putih, dan aksen oranye dari tema JogjaHub. |
| Tipografi | Lexend untuk judul dan Inter untuk isi, metadata, serta label. |
| Kategori | Nama, ID, dan urutan mengikuti API kategori. Penginapan memakai ikon tempat tidur, Beauty & Style memakai palet, Gifting memakai hadiah, dan Dokumentasi memakai kamera. Setiap kategori membuka Katalog dengan filter ID dari backend. |
| Katalog dan kartu layanan | Katalog memakai kanvas yang sama. Kartu menampilkan foto layanan atau logo vendor, nama layanan dan vendor, subkategori, lokasi, harga, dan tombol Pesan. Foto membuka Detail Vendor. |
| Detail vendor | Tombol kembali berada di atas judul. Foto besar diikuti kartu layanan yang menuju pemesanan. Tombol WhatsApp menetap di footer saat vendor memiliki nomor. |
| Rekomendasi Layanan | Beranda menampilkan maksimal delapan layanan dari halaman pertama katalog publik. Backend membatasi katalog ke layanan aktif milik tenant berstatus approved. Lihat semua membuka Katalog. Tarik untuk menyegarkan memuat ulang kategori dan rekomendasi. Rekomendasi punya tampilan memuat, kosong, dan gagal dengan aksi Coba lagi. |

### Bottom bar customer

iOS dan Android memakai varian Rubber Dock tenant melalui CustomerTabNavigator. Permukaan putih membulat dan berbayang mengambang pada footer krem selebar layar. Dock memakai margin sisi 12 dp, atau 8 dp pada layar sempit, dengan lebar maksimum 560 dp. Footer mengisi safe area bawah sampai tepi layar. Konten mendapat ruang tersendiri di atas footer sehingga baris terakhir tetap bisa dijangkau.

Tiga slot tetap berurutan Beranda, Pesanan, Profil. Indikator aktif, gestur, animasi, dan panel pintasan memakai komponen yang sama dengan tenant. Dock tampil pada tiga tab utama. Layar yang dibuka melalui CustomerStackNavigator, seperti Katalog dan Detail Vendor, memiliki navigasi kembali sendiri. Expo Web memakai varian dock sebelumnya.

### Detail Layanan customer · spesifikasi implementasi

Ketukan pada foto atau judul kartu di Rekomendasi Layanan dan Katalog membuka Detail Layanan untuk layanan yang dipilih. Detail Layanan berada di customer stack sebagai rute baru `ServiceDetail` dengan parameter `serviceId`. Tombol kembali mengembalikan customer ke layar asal dengan posisi gulir dan filter sebelumnya. Tombol Pesan pada kartu tetap menjadi pintasan ke pemesanan. Nama vendor di Detail Layanan membuka Detail Vendor dengan UUID dari respons layanan.

#### Susunan layar

~~~text
┌─────────────────────────────────────────┐
│ [‹]                                     │
│ Nama layanan                            │  Latar oranye muda
│ Subkategori · Nama vendor               │
│             Foto utama layanan          │
│ ╭─────────────────╮                     │
│ │ Harga           │                     │
│ │ Rp… / malam     │                     │
│ ╰─────────────────╯                     │
│ Deskripsi               ★ 4,8 (12 ulasan)│
│ Informasi layanan dari vendor           │
│ Foto layanan                            │
│ [ Foto 1 ] [ Foto 2 ] [ Foto 3 ]         │
├─────────────────────────────────────────┤
│             [ Pesan layanan ]           │
│              Area aman bawah            │
└─────────────────────────────────────────┘
~~~

- **Hero.** Letakkan tombol kembali di sisi kiri atas safe area, lalu judul layanan, subkategori, dan nama vendor sebelum foto. Foto utama mengisi lebar hero dengan sudut membulat 24 dp dan rasio sekitar 4:3. Kartu harga putih menumpang pada sudut kiri bawah foto dalam ruang yang disediakan layout. Biarkan harga dan satuannya membungkus pada layar kecil atau saat ukuran teks diperbesar.
- **Harga.** Format angka sebagai Rupiah dengan locale `id-ID`. Tampilkan satuan *per malam* untuk `price_type: per_night` dan *per sesi* untuk `per_session`. Kartu menampilkan tarif layanan. Total dihitung pada layar pemesanan berdasarkan pilihan customer.
- **Deskripsi dan ulasan.** Tempatkan rating di samping judul Deskripsi bila ruang cukup. Pindahkan ke baris berikutnya pada layar sempit atau teks besar. Tampilkan nilai serta jumlah ulasan jika tersedia. Gunakan label *Belum ada ulasan* bila jumlahnya nol. Jika deskripsi kosong, tampilkan *Deskripsi belum tersedia*.
- **Galeri.** Saat ada beberapa foto, tampilkan thumbnail horizontal dengan garis oranye dan status terpilih pada foto aktif. Pilihan thumbnail mengganti foto hero. Gunakan foto bertanda utama, lalu foto pertama menurut `sort_order`. Jika foto kosong atau gagal dimuat, gunakan permukaan oranye muda dengan ikon foto. Tata letak galeri mengadaptasi deretan swatch pada referensi untuk menampilkan foto layanan.
- **Footer pemesanan.** Tombol Pesan layanan memenuhi lebar konten, tinggi minimum 48 dp, dan radius kapsul. Footer tetap di luar konten yang digulir dan mengisi safe area bawah. Beri jarak 16 dp setelah elemen gulir terakhir. Detail Layanan memakai footer pemesanan dengan satu aksi utama.

#### Token JogjaHub

| Peran | Token yang dipakai |
| --- | --- |
| Kanvas dan garis kartu | `customerColors.canvas` (#FAF7F2) dan `customerColors.border` (#E6DED4) |
| Hero dan thumbnail aktif | `colors.primaryFixed` (#FFDBCC) untuk latar, `colors.primary` (#A04100) untuk garis pilihan |
| Kartu harga dan footer | `colors.surfaceContainerLowest` (#FFFFFF) |
| Harga dan bintang ulasan | `colors.primary` (#A04100) |
| Tombol Pesan layanan | `colors.primaryContainer` (#FF6B00) dan label `colors.onPrimaryFixed` (#351000) |
| Judul dan metadata | `colors.navy` untuk judul Lexend 24 dp, `colors.onSurfaceVariant` untuk isi dan metadata Inter 14 dp |

Gunakan margin konten 20 dp, jarak antarseksi 24 dp, dan jarak dalam kelompok 8–12 dp. Tombol kembali, galeri, tautan vendor, dan tombol pesan memiliki area sentuh minimal 48 dp. Label aksesibilitas thumbnail menggunakan urutan foto dan status terpilih.

#### Data dan tindakan

- Muat `GET /services/{serviceId}` lewat `vendorApi.getServiceDetail`. Gunakan `name`, `description`, `price`, `price_type`, `subcategory.name`, `tenant.business_name`, `tenant.uuid`, `photos[].full_url`, `reviews_avg_rating`, dan `reviews_count`.
- Saat memuat, tampilkan indikator dan pertahankan tombol kembali. Pada kegagalan jaringan, tampilkan **Coba lagi**. Jika layanan mengembalikan 404, tampilkan **Layanan tidak tersedia**. Tampilkan tombol Pesan layanan setelah detail berhasil dimuat.
- Tombol **Pesan layanan** membuka `Booking` dengan `serviceId`. Pemilihan tanggal check-in dan check-out untuk Penginapan serta pemilihan tanggal dan jam untuk layanan yang memerlukan slot tetap dilakukan di layar Booking. Variasi produk pada referensi diterjemahkan menjadi galeri foto, sedangkan pilihan jadwal mengikuti aturan layanan yang sudah berlaku.

#### Kriteria penerimaan

- [ ] Dari Beranda dan Katalog, ketuk dua layanan berbeda. Nama, foto, harga, dan ID pemesanan harus cocok dengan kartu yang dipilih. Kembali harus memulihkan posisi gulir dan filter.
- [ ] Periksa warna hero, harga, dan tombol dengan token oranye JogjaHub. Uji lebar 320 dan 390 dp, teks besar, nama panjang, serta safe area Android dan iOS.
- [ ] Uji foto tunggal, beberapa foto, foto gagal, deskripsi kosong, tanpa ulasan, kegagalan jaringan, dan 404.
- [ ] Uji aksi Pesan layanan untuk Penginapan, layanan dengan slot, dan layanan tanpa slot. Setiap alur harus menuju pemesanan untuk ID yang sama.
