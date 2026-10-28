# [REDESIGN] Form Tambah & Edit Layanan Tenant (Service Form Screen) — Mobile-First, Zero-Friction UX

**Labels:** `enhancement`, `design`, `ui/ux`, `frontend-mobile`, `good-first-issue`  
**Assignee:** *TBD (Junior Developer / AI Agent)*  
**Priority:** `High`  
**Milestone:** `MVP Sprint - Vendor Experience`

---

## 📌 Ringkasan Masalah & Latar Belakang (Context & Problem Statement)

Saat ini, formulir tambah dan edit layanan pada aplikasi mobile vendor ([`ServiceFormScreen.tsx`](file:///d:/JogjaHub/jogjahub-mobile/src/features/vendor/listing/screens/ServiceFormScreen.tsx)) memiliki banyak masalah pengalaman pengguna (*UX friction*) yang membuat vendor/tenant kesulitan mendaftarkan atau memperbarui katalog layanannya:

1. **Tombol Simpan Tersembunyi di Header:**
   Tombol simpan hanyalah teks kecil `"Save"` di sudut kanan atas layar. Vendor yang sedang mengisi formulir panjang di bagian bawah harus menggulir kembali ke atas dan sering tidak menyadari di mana tombol simpannya.
2. **Pengalaman Unggah Foto Membingungkan (*Poor Photo Affordance*):**
   - Kotak tambah foto hanya berupa kotak kecil bergaris putus-putus (*horizontal scroll* 88x88 px).
   - Tidak ada pembeda visual antara **"Foto Utama / Sampul"** (yang akan muncul di katalog dan kartu pencarian customer) dengan foto pendukung lainnya.
   - Batasan ukuran (maks. 5MB) dan format hanya muncul sebagai *error toast* setelah pengguna gagal memilih foto.
   - Pada mode Edit, unggah foto dimatikan (*disabled*) karena catatan lama di kode, padahal backend Laravel saat ini sudah mendukung pembaruan foto dan penghapusan foto (`remove_photos`).
3. **Input Harga Tanpa Format Mata Uang (*High Risk of Input Error*):**
   - Harga diinput mentah tanpa pemisah ribuan (misal: `150000`).
   - Sangat rentan kesalahan ketik (*human error*), seperti kelebihan angka nol (`1500000`) atau kekurangan angka nol (`15000`), tanpa adanya visual rupiah atau konfirmasi teks.
4. **Hierarki Kategori & Sub-Kategori Kaku (*Disjointed Pickers*):**
   - Memerlukan dua modal terpisah yang berurutan. Jika kategori belum dipilih, sub-kategori mati tanpa pesan bantuan yang jelas.
5. **Bentuk Form Terasa Monoton & Melelahkan (*Cognitive Fatigue*):**
   - Tidak ada pengelompokan kartu (*card sections*). Semua input ditumpuk dalam satu daftar panjang dengan label huruf kapital kecil (`SERVICE NAME`, `CATEGORY`, `HARGA (Rp)`, dll).
6. **Validasi Tanpa Pesan Inline (*Transient Feedback*):**
   - Ketika ada data yang belum lengkap, hanya muncul *toast notification* selama 2 detik di bagian atas layar. Input yang salah tidak diberi garis merah atau pesan error di bawah field-nya.
7. **Keyboard Menutupi Input (*No Keyboard Avoiding View*):**
   - Layar tidak dibungkus `KeyboardAvoidingView`, sehingga saat mengetik deskripsi atau harga, keyboard virtual menutupi input field.

---

## 🎯 Tujuan Desain Baru (Design Goals)

1. **Struktur Berbasis Kartu (*Card-Based Grouping*):** Mengelompokkan input ke dalam 5 bagian logis dengan visual kartu modern, icon penanda, dan hierarki tipografi yang jelas.
2. **Foto Sampul yang Jelas (*Hero Cover Photo*):** Menonjolkan foto pertama sebagai "Foto Utama / Sampul" dengan badge khusus, serta galeri pendukung hingga 9 foto lainnya.
3. **Input Harga Cerdas (*Smart Currency Input*):** Format ribuan otomatis (misal: `Rp 150.000`) disertai teks terbilang instan (*"Seratus Lima Puluh Ribu Rupiah"*) untuk mencegah salah harga.
4. **Sticky Bottom Action Bar:** Tombol *"Simpan Layanan"* yang selalu terlihat dan mudah dijangkau oleh jempol di bagian bawah layar (*one-handed mobile friendly*).
5. **Inline Validation & Auto-Scroll:** Pesan error langsung berwarna merah di bawah input yang belum lengkap, serta otomatis fokus ke field yang bermasalah.

---

## 📱 Wireframe & Tata Letak Visual (Visual Mockup)

```
┌─────────────────────────────────────────────────────────┐
│ [←] Tambah Layanan Baru                             [?] │  <- Header bersih
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [ 1. FOTO & MEDIA LAYANAN ] ──────────── (Maks 10 Foto) │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  ★ FOTO UTAMA / SAMPUL                              │ │  <- Hero Cover Box
│ │  ┌───────────────────────────────────────────────┐  │ │
│ │  │                                               │  │ │
│ │  │        [ 📷 Unggah Foto Sampul ]              │  │ │
│ │  │      Format JPG, PNG, WebP (Maks 5MB)         │  │ │
│ │  │                                               │  │ │
│ │  └───────────────────────────────────────────────┘  │ │
│ │  FOTO PENDUKUNG / GALERI:                           │ │
│ │  [+] [Foto 2] [Foto 3] [Foto 4] ... (Scroll Hrz)    │ │  <- Gallery Thumbnails
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [ 2. INFORMASI DASAR ] ──────────────────────────────── │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Nama Layanan *                                      │ │
│ │ [ Contoh: Rias Wisuda Natural + Hijab Do       ]    │ │
│ │                                                     │ │
│ │ Kategori & Sub-Kategori *                           │ │
│ │ [ Beauty & Style → MUA Wisuda                  [v] ]│ │  <- Unified Selector
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [ 3. HARGA LAYANAN ] ────────────────────────────────── │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Biaya Jasa / Tarif *                                │ │
│ │ [ Rp | 150.000                                 ]    │ │  <- Formatted Input
│ │ ℹ️ Terbilang: Seratus Lima Puluh Ribu Rupiah        │ │  <- Spelled-out Preview
│ │ Quick Add: [+50rb]  [+100rb]  [+250rb]              │ │  <- Suggestion Chips
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [ 4. DESKRIPSI & KETENTUAN ] ────────────────────────── │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Deskripsi Lengkap Layanan                           │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Jelaskan apa saja yang didapat pelanggan,       │ │ │
│ │ │ durasi pengerjaan, atau ketentuan layanan...    │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │                                            42/1000  │ │  <- Character Counter
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [ 5. STATUS KETERSEDIAAN ] ──────────────────────────── │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Layanan Aktif untuk Dipesan                [ (O) ]  │ │  <- Switch Component
│ │ Nonaktifkan sementara jika kuota layanan penuh.     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │              [ SIMPAN LAYANAN ]                     │ │  <- Sticky Bottom Button
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Kriteria Penerimaan (Acceptance Criteria - Gherkin Style)

### Skenario 1: Upload Foto Sampul dan Foto Pendukung
- **Given** Vendor membuka layar *Tambah Service*.
- **When** Vendor memilih foto pertama dari galeri.
- **Then** Foto tersebut otomatis ditempatkan di slot **"Foto Utama / Sampul"** dengan badge `★ Foto Utama`.
- **And** Ketika vendor memilih foto berikutnya (foto ke-2 s/d ke-10), foto tersebut muncul di baris thumbnail galeri.
- **And** Setiap thumbnail memiliki tombol hapus (icon tong sampah) untuk membatalkan foto tertentu.

### Skenario 2: Pemilihan Kategori dan Sub-Kategori yang Terpadu
- **Given** Vendor belum memilih kategori layanan.
- **When** Vendor menekan dropdown *Kategori & Sub-Kategori*.
- **Then** Muncul Bottom Sheet yang menampilkan daftar Kategori Utama beserta Sub-kategorinya secara terstruktur.
- **When** Vendor memilih sub-kategori (misal: "MUA Wisuda" di bawah "Beauty & Style").
- **Then** Field menampilkan breadcrumb rapi: `Beauty & Style → MUA Wisuda` dan state `selectedSubcategoryId` terisi.

### Skenario 3: Input Harga dengan Format Rupiah & Preview Terbilang
- **Given** Vendor berada pada field harga.
- **When** Vendor mengetik angka `250000`.
- **Then** Nilai pada input otomatis diformat menjadi `Rp 250.000` (ada pemisah ribuan titik).
- **And** Di bawah input muncul teks konfirmasi hijau/oranye: *"Terbilang: Dua Ratus Lima Puluh Ribu Rupiah"*.
- **When** Vendor menekan tombol chip `+ 50rb`.
- **Then** Nilai harga bertambah menjadi `Rp 300.000` dan teks terbilang diperbarui.

### Skenario 4: Validasi Formulir dan Inline Error
- **Given** Vendor belum mengisi Nama Layanan atau belum memilih Sub-Kategori.
- **When** Vendor menekan tombol *"Simpan Layanan"* di bottom bar.
- **Then** Form tidak terkirim ke server.
- **And** Field yang belum diisi menampilkan garis border merah dan pesan error di bawahnya (misal: *"Nama layanan wajib diisi"*).
- **And** Layar otomatis menggulir (*auto-scroll*) ke field error pertama.

### Skenario 5: Mode Edit Layanan
- **Given** Vendor membuka layanan yang sudah ada dalam mode Edit.
- **When** Layar terbuka.
- **Then** Judul layar menjadi *"Edit Layanan"*, data nama, sub-kategori, harga, dan deskripsi terisi otomatis.
- **And** Foto-foto yang sudah ada sebelumnya ditampilkan di galeri dengan opsi hapus (`remove_photos`).
- **And** Tombol aksi bawah bertuliskan *"Perbarui Layanan"*.

---

## 🛠️ Petunjuk Teknis Implementasi (Technical Specification)

Berikut panduan kode dan komponen yang siap pakai untuk programmer pelaksana:

### 1. Struktur State pada Komponen
Gunakan state berikut di [`ServiceFormScreen.tsx`](file:///d:/JogjaHub/jogjahub-mobile/src/features/vendor/listing/screens/ServiceFormScreen.tsx):

```typescript
// 1. Data Form
const [name, setName] = useState(existingService?.name ?? '');
const [rawPrice, setRawPrice] = useState(existingService ? String(existingService.price) : '');
const [description, setDescription] = useState(existingService?.description ?? '');
const [isActive, setIsActive] = useState(true);
const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(
  existingService?.subcategory?.id ?? null
);

// 2. Media / Foto
const [existingPhotos, setExistingPhotos] = useState<ServicePhoto[]>(existingService?.photos ?? []);
const [newPhotos, setNewPhotos] = useState<PickedPhoto[]>([]);
const [removedPhotoUrls, setRemovedPhotoUrls] = useState<string[]>([]);

// 3. UI & Validasi
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
const [saving, setSaving] = useState(false);
const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
```

---

### 2. Helper Formatter Mata Uang & Angka Terbilang

Buat helper fungsi di dalam berkas (atau di `src/utils/`):

```typescript
// Format angka saat diketik: "150000" -> "150.000"
export function formatThousands(value: string): string {
  const cleanNumber = value.replace(/\D/g, '');
  if (!cleanNumber) return '';
  return Number(cleanNumber).toLocaleString('id-ID');
}

// Konversi angka ke kalimat terbilang bahasa Indonesia
export function terbilangRupiah(nominal: number): string {
  if (!nominal || isNaN(nominal) || nominal <= 0) return '';
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  
  function sebut(n: number): string {
    if (n < 12) return satuan[n];
    if (n < 20) return sebut(n - 10) + ' Belas';
    if (n < 100) return sebut(Math.floor(n / 10)) + ' Puluh ' + sebut(n % 10);
    if (n < 200) return 'Seratus ' + sebut(n - 100);
    if (n < 1000) return sebut(Math.floor(n / 100)) + ' Ratus ' + sebut(n % 100);
    if (n < 2000) return 'Seribu ' + sebut(n - 1000);
    if (n < 1000000) return sebut(Math.floor(n / 1000)) + ' Ribu ' + sebut(n % 1000);
    if (n < 1000000000) return sebut(Math.floor(n / 1000000)) + ' Juta ' + sebut(n % 1000000);
    return '';
  }
  
  return sebut(nominal).replace(/\s+/g, ' ').trim() + ' Rupiah';
}
```

---

### 3. Komponen Input & Validasi

Gunakan komponen [`Input.tsx`](file:///d:/JogjaHub/jogjahub-mobile/src/components/Input/Input.tsx) dan [`Button.tsx`](file:///d:/JogjaHub/jogjahub-mobile/src/components/Button/Button.tsx) bawaan proyek yang sudah memiliki styling token JogjaHub:

```tsx
// Contoh Input Nama Layanan dengan error inline
<Input
  label="Nama Layanan *"
  placeholder="Contoh: Rias Wisuda Natural + Hijab Do"
  value={name}
  onChangeText={(text) => {
    setName(text);
    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
  }}
  error={fieldErrors.name}
/>

// Contoh Input Harga dengan Prefix "Rp"
<Input
  label="Biaya Jasa / Tarif *"
  placeholder="150.000"
  keyboardType="numeric"
  value={formatThousands(rawPrice)}
  onChangeText={(text) => {
    const numericOnly = text.replace(/\D/g, '');
    setRawPrice(numericOnly);
    if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: '' }));
  }}
  leftIcon={<Text style={styles.currencyPrefix}>Rp</Text>}
  error={fieldErrors.price}
/>
```

---

### 4. Layout Sticky Bottom Action Bar

Gunakan pembungkus `KeyboardAvoidingView` dengan tombol *sticky* di bawah:

```tsx
<KeyboardAvoidingView 
  style={styles.screen} 
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
>
  <ScrollView 
    contentContainerStyle={styles.scrollContent}
    keyboardShouldPersistTaps="handled"
  >
    {/* Card 1: Foto */}
    {/* Card 2: Info Dasar */}
    {/* Card 3: Harga */}
    {/* Card 4: Deskripsi */}
    {/* Card 5: Ketersediaan */}
  </ScrollView>

  {/* Sticky Bottom Bar */}
  <View style={styles.stickyBottomBar}>
    <Button
      label={saving ? 'Menyimpan Layanan...' : (isEdit ? 'Perbarui Layanan' : 'Simpan Layanan')}
      onPress={handleSave}
      loading={saving}
      disabled={saving}
    />
  </View>
</KeyboardAvoidingView>
```

---

### 5. Kompatibilitas API Backend

Backend Laravel (`Tenant\ServiceController`) mendukung:
- **CREATE (`POST /api/v1/tenant/services`)**: Menerima `name`, `subcategory_id`, `price`, `description`, `photos[]`.
- **UPDATE (`POST /api/v1/tenant/services/{id}`)** dengan method spoofing `_method: 'PUT'`:
  Menerima `name`, `subcategory_id`, `price`, `description`, `photos[]` (foto baru), dan `remove_photos[]` (array path foto lama yang dihapus).

Pastikan `handleSave` pada `ServiceFormScreen.tsx` mengirimkan:
```typescript
if (isEdit) {
  const formData = new FormData();
  formData.append('_method', 'PUT');
  formData.append('name', name.trim());
  formData.append('subcategory_id', String(selectedSubcategoryId));
  formData.append('price', rawPrice);
  formData.append('description', description.trim());
  
  // Foto baru
  newPhotos.forEach((photo) => {
    // @ts-ignore
    formData.append('photos[]', { uri: photo.uri, name: photo.name, type: photo.type });
  });
  
  // Foto lama yang dihapus
  removedPhotoUrls.forEach((path) => {
    formData.append('remove_photos[]', path);
  });

  await vendorApi.updateService(existingService.id, formData);
}
```

---

## 🎨 Spesifikasi Desain & Token Warna (Theme Tokens)

Gunakan token yang sudah terdefinisi di `src/constants/theme/`:

| Elemen | Token / Nilai | Keterangan |
|---|---|---|
| Background Layar | `colors.surface` (`#f8f9ff`) | Latar belakang bersih |
| Kartu Bagian | `colors.surfaceContainerLowest` (`#ffffff`) | Card container putih dengan shadow halus |
| Border Kartu | `#F1F5F9` / `radius.lg` (12px) | Rounded card modern |
| Tombol Utama (CTA) | `colors.primaryContainer` (`#ff6b00`) | Bright Orange khas JogjaHub |
| Badge Foto Utama | `#FEF3C7` (bg), `#D97706` (text/border) | Oranye-emas penanda Cover |
| Teks Terbilang | `#059669` (Hijau emerald) | Visual feedback nominal valid |
| Border Input Aktif | `colors.primaryContainer` (`#ff6b00`) | Fokus input |
| Border Input Error | `colors.error` (`#ba1a1a`) | Peringatan field tidak valid |

---

## ⚠️ Kasus Batas (*Edge Cases & Error Handling*)

1. **Foto Lebih dari 10:** Tampilkan peringatan *"Maksimal 10 foto telah tercapai"*, tombol tambah foto dinonaktifkan.
2. **Ukuran File Terlalu Besar:** Tolak pemilihan foto > 5MB dengan dialog ramah: *"Ukuran foto melebihi 5MB. Silakan pilih foto dengan resolusi lebih ringan."*
3. **Format Angka Harga:** Jangan izinkan karakter selain digit `0-9`. Jika vendor memasukkan `0` atau angka negatif, berikan error inline *"Harga layanan tidak boleh 0"*.
4. **Perubahan Kategori Utama:** Jika vendor mengganti kategori utama, otomatis reset pilihan sub-kategori agar tidak terjadi ketidakcocokan ID sub-kategori di database.
5. **Mode Edit Tanpa Ubah Foto:** Pastikan form tetap dapat disimpan tanpa error meskipun vendor tidak mengubah foto sama sekali.

---

## 🧪 Checklist Pengujian Manual (Manual QA Checklist)

- [ ] Buka tab **Layanan** di aplikasi vendor, lalu tekan tombol **`+ Tambah Layanan`**.
- [ ] Pastikan tampilan form memiliki 5 seksi kartu yang rapi dan tombol *"Simpan Layanan"* ada di sticky bar bawah.
- [ ] Tekan *"Simpan Layanan"* saat form masih kosong. Pastikan muncul border merah dan teks error di bawah Nama Layanan, Kategori, dan Harga.
- [ ] Upload 1 foto, pastikan foto tersebut mendapat label badge **"★ Foto Utama / Sampul"**.
- [ ] Ketik harga `350000`, pastikan terformat menjadi `Rp 350.000` dan teks terbilang memunculkan *"Tiga Ratus Lima Puluh Ribu Rupiah"*.
- [ ] Buka keyboard virtual pada kolom deskripsi, pastikan keyboard tidak menutupi input teks.
- [ ] Simpan layanan, pastikan muncul notifikasi sukses dan kembali ke daftar layanan dengan data yang baru dibuat.
- [ ] Buka layanan tersebut dalam mode **Edit**, ubah harga atau nama, dan pastikan data tersimpan dengan benar.

---

## 📂 Berkas yang Dimodifikasi

| Proyek | Jalur Berkas | Keterangan Perubahan |
|---|---|---|
| **Mobile** | [`jogjahub-mobile/src/features/vendor/listing/screens/ServiceFormScreen.tsx`](file:///d:/JogjaHub/jogjahub-mobile/src/features/vendor/listing/screens/ServiceFormScreen.tsx) | Redesign total UI form, kartu seksi, live currency format, hero photo uploader, sticky CTA |
| **Mobile** | [`jogjahub-mobile/src/features/vendor/listing/components/ServicePhoto.tsx`](file:///d:/JogjaHub/jogjahub-mobile/src/features/vendor/listing/components/ServicePhoto.tsx) | Dukungan rendering thumbnail & badge cover photo |
| **Mobile** | [`jogjahub-mobile/src/utils/formatCurrency.ts`](file:///d:/JogjaHub/jogjahub-mobile/src/utils/formatCurrency.ts) | Menambahkan fungsi `formatThousands` & `terbilangRupiah` |

---

> [!TIP]
> **Catatan untuk Pelaksana (Junior Developer / AI Agent):**
> Anda tidak perlu mengubah database atau controller backend. Gunakan endpoint `vendorApi.createService` dan `vendorApi.updateService` yang sudah ada. Fokuskan seluruh pengerjaan pada peningkatan estetika, kenyamanan ketik, dan pencegahan kesalahan input di sisi aplikasi mobile (`jogjahub-mobile`).

