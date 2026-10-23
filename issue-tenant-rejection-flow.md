# [FEATURE] Penanganan Rejection Reason & Alur Revisi Pendaftaran Tenant Tanpa Mengulang dari Awal

**Labels:** `enhancement`, `backend`, `frontend-web`, `frontend-mobile`, `good-first-issue`  
**Assignee:** *TBD (Junior Developer / AI Agent)*  
**Priority:** `High`  
**Milestone:** `MVP Sprint - Onboarding & Vendor Verification`

---

## 📌 Ringkasan Masalah & Kebutuhan (Context & Problem Statement)

Saat ini, ketika calon vendor/tenant mendaftarkan usahanya di aplikasi JogjaHub:
1. **Admin di Web Dashboard** dapat menolak (*reject*) pendaftaran melalui tabel verifikasi vendor, namun UI input alasan penolakan masih sederhana (inline textarea) dan belum memiliki preset/panduan alasan standar maupun preview dokumen yang aman.
2. **Saat pendaftaran ditolak oleh Admin**, alasan penolakan (`rejection_reason`) **tidak dikirimkan** pada payload respon login backend (`POST /api/v1/auth/login`), sehingga aplikasi mobile tidak dapat menampilkan alasan spesifik mengapa pendaftaran ditolak.
3. **Di aplikasi mobile (`jogjahub-mobile`)**, halaman `PendingApprovalScreen` hanya menampilkan pesan generik bahwa akun ditolak, dengan satu-satunya pilihan tombol *"Kembali ke Login"*.
4. **Masalah Paling Kritis:** Tenant yang ditolak **terjebak (*deadlock*)**. Mereka tidak bisa mengubah data yang salah atau mengunggah ulang dokumen yang diminta tanpa mengulang pendaftaran dari awal. Jika mencoba daftar ulang dari awal dengan email/nomor HP yang sama, sistem akan menolak karena email sudah terdaftar di database.

### 🎯 Tujuan yang Ingin Dicapai (Goal)
1. **Admin Web:** Memiliki Modal UI Penolakan yang ramah pengguna, dilengkapi pilihan cepat (*chips/presets*) alasan umum (mis. KTP buram, NIB tidak valid, lokasi di luar DIY), validasi input, dan counter karakter (maks. 500 karakter).
2. **Backend API:** Memastikan `rejection_reason` dikirimkan saat tenant login atau mengambil profil, serta endpoint pembaruan profil (`PUT /api/v1/tenant/profile`) mengembalikan status ke `pending` dan mengosongkan `rejection_reason`.
3. **Mobile App:** Tenant yang ditolak melihat kartu informasi alasan penolakan secara transparan, serta memiliki tombol **"Perbaiki Data Pendaftaran"** yang membuka formulir dengan data lama yang **sudah terisi otomatis (*pre-filled*)**. Tenant cukup memperbaiki bagian yang salah/mengunggah dokumen baru, lalu mengirim ulang tanpa mengulang dari nol.

---

## 🗺️ Alur Sistem (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin (Web)
    actor Tenant as Tenant (Mobile)
    participant Web as Web Dashboard (Next.js)
    participant API as Backend (Laravel 11)
    participant DB as Database (MySQL)
    participant Mobile as Mobile App (React Native)

    Tenant->>API: 1. Registrasi Vendor (POST /auth/register/tenant)
    API->>DB: Status: "pending", rejection_reason: null
    Admin->>Web: 2. Buka Menu Verifikasi Vendor (/admin/vendors)
    Web->>API: GET /admin/tenants/pending
    Admin->>Web: 3. Klik "Tolak", isi alasan: "Foto KTP buram"
    Web->>API: PATCH /admin/tenants/{uuid}/reject { rejection_reason }
    API->>DB: Update status: "rejected", rejection_reason: "Foto KTP buram"
    
    Tenant->>Mobile: 4. Buka App / Login
    Mobile->>API: POST /auth/login
    API-->>Mobile: Response { tenant_status: "rejected", rejection_reason: "Foto KTP buram", ... }
    Mobile->>Mobile: 5. Render PendingApprovalScreen (Mode Ditolak)
    Note over Mobile: Tampilkan Box Alasan Penolakan:<br/>"Catatan Admin: Foto KTP buram"<br/>+ Tombol "Perbaiki Data Pendaftaran"
    
    Tenant->>Mobile: 6. Klik "Perbaiki Data Pendaftaran"
    Mobile->>API: GET /tenant/profile (Fetch data profil tersimpan)
    Mobile->>Mobile: 7. Buka Form Revisi (Semua field terisi otomatis)
    Tenant->>Mobile: 8. Upload ulang KTP baru & Simpan
    Mobile->>API: PUT /tenant/profile (Multipart form)
    API->>DB: Update status: "pending", rejection_reason: null
    Mobile->>Mobile: 9. Redirect ke PendingApprovalScreen (Mode Menunggu Review)
```

---

## 📋 Kriteria Penerimaan (Acceptance Criteria - Gherkin Style)

### Skenario 1: Admin Menolak Pendaftaran dengan Alasan Spesifik di Web
- **Given** Admin membuka halaman `http://localhost:3000/admin/vendors` dan terdapat tenant berstatus *pending*.
- **When** Admin menekan tombol *"Tolak"* pada baris tenant.
- **Then** Muncul modal konfirmasi penolakan dengan field alasan (wajib diisi, maks. 500 karakter) dan tombol preset alasan cepat.
- **When** Admin memilih preset alasan atau mengetik alasan sendiri, lalu menekan *"Kirim Penolakan"*.
- **Then** Request `PATCH /api/v1/admin/tenants/{uuid}/reject` dikirim dengan payload `{ rejection_reason: "..." }`.
- **And** Tenant hilang dari daftar antrean verifikasi dan muncul notifikasi/toast sukses.

### Skenario 2: Tenant Melihat Alasan Penolakan di Aplikasi Mobile
- **Given** Akun tenant telah ditolak oleh Admin dengan alasan `"Foto KTP buram dan terpotong"`.
- **When** Tenant membuka aplikasi atau melakukan login di `jogjahub-mobile`.
- **Then** Tenant diarahkan ke layar `PendingApprovalScreen` dalam mode penolakan (*rejected*).
- **And** Terdapat kartu peringatan berwarna merah/oranye yang memuat teks:
  - Judul: *"Pendaftaran Perlu Diperbaiki"*
  - Catatan Admin: *"Foto KTP buram dan terpotong"*
  - Penjelasan: *"Data pendaftaran Anda tersimpan. Silakan perbaiki data yang diminta tanpa mendaftar ulang dari awal."*
- **And** Tersedia tombol utama: **"Perbaiki Data Pendaftaran"** dan tombol sekunder: *"Kembali ke Login"*.

### Skenario 3: Tenant Melakukan Revisi dan Mengirim Ulang Pendaftaran
- **Given** Tenant berada di layar `PendingApprovalScreen` yang menampilkan catatan penolakan.
- **When** Tenant menekan tombol **"Perbaiki Data Pendaftaran"**.
- **Then** Aplikasi membuka layar formulir revisi (`VendorOnboardingScreen` atau layar edit registrasi).
- **And** Semua input (Nama Usaha, Deskripsi, Kategori Layanan, Alamat Lengkap, Koordinat Peta, dan WhatsApp) sudah **terisi otomatis** sesuai data pendaftaran sebelumnya.
- **And** Terdapat banner di bagian atas formulir yang mengingatkan catatan revisi dari admin.
- **When** Tenant memperbarui data yang salah / mengunggah dokumen KTP baru dan menekan tombol **"Simpan & Ajukan Ulang"**.
- **Then** Aplikasi mengirim request `PUT /api/v1/tenant/profile` ke backend.
- **And** Backend mengupdate data tenant, mengubah status menjadi `pending`, dan mereset `rejection_reason` menjadi `null`.
- **And** Aplikasi mengarahkan kembali tenant ke layar status antrean dengan pesan: *"Pendaftaran Berhasil Dikirim Ulang. Menunggu Persetujuan Admin."*

---

## 🛠️ Petunjuk Teknis Implementasi (Technical Specification)

Bagian ini ditulis secara mendalam agar dapat langsung diikuti oleh programmer junior atau model AI.

### 1. Perubahan Backend (`jogjahub-backend`)

#### A. File: `app/Http/Controllers/Api/AuthController.php`
- **Tujuan:** Mengembalikan `rejection_reason` saat tenant login.
- **Lokasi Kode:** Di dalam method `login(LoginRequest $request)`, sekitar baris 56–66.
- **Perubahan:**
```diff
         // Jika user adalah tenant, sertakan status tenant profile
         if ($user->role === 'tenant') {
             $tenantProfile = TenantProfile::where('user_id', $user->id)->first();
             if ($tenantProfile) {
                 $response['data']['tenant_status']  = $tenantProfile->status;
                 $response['data']['business_name']  = $tenantProfile->business_name;
+                $response['data']['rejection_reason'] = $tenantProfile->rejection_reason;
             } else {
                 $response['data']['tenant_status'] = 'pending';
                 $response['data']['business_name'] = $user->name;
+                $response['data']['rejection_reason'] = null;
             }
         }
```

#### B. Verifikasi Endpoint Terkait yang Sudah Ada (Jangan Dirusak):
- `app/Http/Controllers/Api/Tenant/ProfileController.php`:
  - Method `update(UpdateProfileRequest $request)` sudah mengatur `'status' => 'pending'` dan `'rejection_reason' => null`. Pastikan logika ini tetap berjalan saat tenant melakukan update.
  - Method `show(Request $request)` mengembalikan `TenantProfileResource` yang sudah memuat `rejection_reason` ketika diakses oleh pemilik profil.
- `app/Http/Requests/Tenant/UpdateProfileRequest.php`:
  - Pastikan field file (`ktp`, `nib`, `portfolio`) bertipe `sometimes|file` jika tenant hanya ingin mengubah informasi teks tanpa mengunggah ulang file yang sudah benar.

---

### 2. Perubahan Web Admin (`jogjahub-web`)

#### File: `src/app/admin/vendors/page.tsx`
- **Tujuan:** Mengganti inline textarea penolakan dengan Komponen Modal Dialog yang elegan dan memiliki tombol *preset/quick chip*.
- **Spesifikasi UI Modal Penolakan:**
  1. **State yang dibutuhkan:**
     ```typescript
     const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
     const [selectedTenant, setSelectedTenant] = useState<PendingTenant | null>(null);
     const [rejectionReason, setRejectionReason] = useState("");
     const [isSubmitting, setIsSubmitting] = useState(false);
     ```
  2. **Daftar Preset Alasan (Quick Chips):**
     ```typescript
     const PRESET_REASONS = [
       "Foto KTP buram / tidak terbaca",
       "Dokumen NIB / Legalitas tidak sesuai nama pemilik",
       "Titik koordinat lokasi berada di luar Daerah Istimewa Yogyakarta",
       "Kategori layanan tidak sesuai dengan portofolio yang dilampirkan",
       "Nomor kontak WhatsApp tidak aktif atau tidak dapat dihubungi",
     ];
     ```
  3. **Komponen Modal:**
     - Tampilkan nama bisnis yang sedang diproses: `Tolak Pendaftaran: {selectedTenant.business_name}`.
     - Area textarea dengan counter karakter: `${rejectionReason.length}/500`.
     - Tombol chip preset yang jika diklik akan otomatis mengisi atau menambahkan teks ke textarea.
     - Tombol aksi:
       - *"Batal"*: Menutup modal dan membersihkan input.
       - *"Kirim Penolakan"*: Disabled jika `rejectionReason.trim().length === 0` atau `isSubmitting === true`.
  4. **Penanganan Submit:**
     ```typescript
     async function handleConfirmReject() {
       if (!selectedTenant || !rejectionReason.trim()) return;
       setIsSubmitting(true);
       try {
         await adminApi.rejectTenant(selectedTenant.uuid, rejectionReason.trim());
         setTenants((prev) => prev.filter((t) => t.uuid !== selectedTenant.uuid));
         setIsRejectModalOpen(false);
         setSelectedTenant(null);
         setRejectionReason("");
       } catch (err) {
         alert(err instanceof Error ? err.message : "Gagal menolak vendor.");
       } finally {
         setIsSubmitting(false);
       }
     }
     ```

---

### 3. Perubahan Mobile App (`jogjahub-mobile`)

#### A. File: `src/types/vendor.ts`
Perbarui tipe `TenantProfile` agar mengenali `rejection_reason`:
```typescript
export interface TenantProfile {
  id: number;
  business_name: string;
  description: string | null;
  address: {
    street: string;
    city: string;
    province: string;
    postal_code: string | null;
  };
  latitude: number;
  longitude: number;
  whatsapp_number: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null; // <-- TAMBAHKAN FIELD INI
  categories: Array<{
    id: number;
    name: string;
  }>;
}
```

#### B. File: `src/features/auth/store/authSlice.ts`
Tambahkan `rejectionReason` ke state autentikasi:
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  tenantStatus?: string | null;
  businessName?: string | null;
  rejectionReason?: string | null; // <-- TAMBAHKAN INI
  tenantProfile?: TenantProfile | null;
  isHydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  tenantStatus: null,
  businessName: null,
  rejectionReason: null, // <-- INITIAL VALUE
  tenantProfile: null,
  isHydrated: false,
};
```
Perbarui reducer `setSession`, `logout`, dan `restoreSession`:
- Pada `setSession`: simpan `state.rejectionReason = action.payload.rejectionReason ?? null;`
- Pada `logout`: reset `state.rejectionReason = null;`
- Pada `restoreSession`: pulihkan `state.rejectionReason = payload?.rejectionReason ?? null;`
- Tambahkan action helper `setTenantStatusPending(state)`:
  ```typescript
  setTenantStatusPending(state) {
    state.tenantStatus = 'pending';
    state.rejectionReason = null;
  }
  ```

#### C. File: `src/features/auth/store/authListener.ts` & `bootstrapAuth.ts`
Pastikan `rejectionReason` ikut tersimpan di `@jogjahub/session` AsyncStorage dan dipulihkan kembali saat aplikasi dibuka ulang.

#### D. File: `src/features/auth/hooks/useLogin.ts`
Ambil field `rejection_reason` dari respon login backend dan teruskan ke Redux:
```typescript
const { user, token, tenant_status, business_name, rejection_reason } = response.data.data;
dispatch(setSession({
  user: normalizedUser,
  token,
  tenantStatus: tenant_status ?? null,
  businessName: business_name ?? null,
  rejectionReason: rejection_reason ?? null,
}));
```

#### E. File: `src/navigation/RootNavigator.tsx`
Daftarkan screen edit/revisi pada navigator antrean pending/rejected:
```tsx
{user &&
  normalizedRole === 'vendor' &&
  (tenantStatus === 'pending' || tenantStatus === 'rejected') && (
    <Stack.Navigator
      key="pending-stack"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="PendingApproval"
        component={PendingApprovalScreen}
        initialParams={{
          businessName: businessName ?? undefined,
          rejected: tenantStatus === 'rejected',
        }}
      />
      <Stack.Screen
        name="VendorOnboarding"
        component={VendorOnboardingScreen}
      />
    </Stack.Navigator>
)}
```

#### F. File: `src/features/vendor/onboarding/screens/PendingApprovalScreen.tsx`
- Ambil `rejectionReason` dari Redux:
  ```typescript
  const rejectionReason = useSelector((state: RootState) => state.auth?.rejectionReason);
  ```
- Jika `isRejected === true`:
  - Tampilkan kotak peringatan penolakan dengan style kartu kontras (`colors.errorContainer`).
  - Tampilkan judul: **"Pendaftaran Ditolak / Perlu Revisi"**.
  - Tampilkan isi alasan penolakan:
    ```tsx
    <View style={styles.rejectionCard}>
      <Text style={styles.rejectionHeader}>Catatan dari Admin:</Text>
      <Text style={styles.rejectionText}>
        {rejectionReason || "Admin belum menyertakan rincian alasan. Silakan periksa kembali data profil Anda."}
      </Text>
    </View>
    ```
  - Tampilkan instruksi: *"Data pendaftaran Anda tidak hilang. Silakan perbaiki data yang diminta lalu ajukan kembali."*
  - Tambahkan tombol aksi:
    ```tsx
    <View style={styles.buttonContainer}>
      <Button
        label="Perbaiki Data Pendaftaran"
        onPress={() => navigation.navigate("VendorOnboarding" as any)}
      />
      <View style={{ height: 12 }} />
      <Button
        label="Keluar / Ganti Akun"
        variant="outline" // atau style sekunder
        onPress={handleBackToLogin}
      />
    </View>
    ```

#### G. File: `src/features/vendor/onboarding/screens/VendorOnboardingScreen.tsx`
- Saat layar dibuka (`useEffect`):
  Jika data profil di Redux belum ada, lakukan pemanggilan `vendorApi.getMyProfile()` untuk memuat profil lama dari database.
- Tampilkan Banner Catatan Revisi di atas formulir:
  Jika `rejectionReason` terisi, tampilkan alert di atas form:
  ```tsx
  <View style={styles.alertBanner}>
    <Text style={styles.alertTitle}>Perhatian (Catatan Admin):</Text>
    <Text style={styles.alertMessage}>{rejectionReason}</Text>
  </View>
  ```
- Form sudah memuat field: Nama Bisnis, Deskripsi, Kategori, Alamat, Koordinat GPS, dan WhatsApp.
- Tambahkan bagian unggah dokumen KTP / NIB jika sebelumnya dokumen ditolak.
- Saat tombol **"Simpan & Kirim Ulang"** ditekan:
  - Kirim data ke `vendorApi.updateMyProfile(...)`.
  - Dispatch action Redux `setTenantStatusPending()`.
  - Tampilkan Toast: *"Pendaftaran berhasil diperbarui dan dikirim kembali ke admin."*
  - Arahkan navigasi kembali ke `PendingApprovalScreen`.

---

## 🧪 Panduan Pengujian Manual (Manual QA Checklist)

Lakukan pengujian berikut secara urut untuk memastikan tidak ada regresi:

- [ ] **Test Case 1: Rejection dari Web Admin**
  1. Login sebagai Admin di Web Dashboard (`http://localhost:3000/admin-login`).
  2. Buka menu Verifikasi Vendor.
  3. Klik tombol *"Tolak"* pada vendor berstatus *pending*.
  4. Pastikan modal penolakan muncul, pilih chip preset *"Foto KTP buram / tidak terbaca"*, lalu klik *"Kirim Penolakan"*.
  5. Cek database tabel `tenant_profiles`: kolom `status` harus bernilai `'rejected'` dan `rejection_reason` berisi catatan yang dikirim.

- [ ] **Test Case 2: Tampilan Alasan di Mobile App**
  1. Buka aplikasi mobile `jogjahub-mobile` dan login dengan akun vendor yang baru saja ditolak.
  2. Pastikan diarahkan ke `PendingApprovalScreen`.
  3. Verifikasi bahwa teks alasan penolakan *"Foto KTP buram / tidak terbaca"* muncul dengan jelas di kartu catatan admin.
  4. Tutup aplikasi dan buka kembali. Pastikan sesi tetap bertahan dan alasan penolakan tetap muncul (tidak hilang karena restart app).

- [ ] **Test Case 3: Revisi Tanpa Mengulang Pendaftaran**
  1. Pada `PendingApprovalScreen`, klik tombol **"Perbaiki Data Pendaftaran"**.
  2. Pastikan layar formulir terbuka dan data Nama Bisnis, Alamat, WhatsApp, dan Kategori **sudah terisi otomatis** tanpa kosong.
  3. Ubah salah satu data atau unggah dokumen baru, lalu tekan *"Simpan Profil"*.
  4. Pastikan muncul notifikasi sukses dan layar kembali ke `PendingApprovalScreen` dengan tampilan status **"Menunggu Persetujuan Admin"** (icon jam pasir ⏳ dan alasan penolakan bersih).
  5. Periksa database: `status` berubah kembali menjadi `'pending'` dan `rejection_reason` bernilai `null`.

- [ ] **Test Case 4: Verifikasi Ulang oleh Admin**
  1. Buka kembali dashboard Web Admin.
  2. Pastikan vendor yang baru saja mengajukan revisi muncul kembali di tabel Verifikasi Vendor (Pending).
  3. Klik *"Setujui"*.
  4. Vendor login / buka aplikasi mobile dan berhasil masuk ke `VendorTabNavigator` (Dashboard Toko).

---

## 📂 Ringkasan Berkas yang Diubah / Dibuat

| Proyek | Jalur Berkas | Perubahan |
|---|---|---|
| **Backend** | `jogjahub-backend/app/Http/Controllers/Api/AuthController.php` | Sertakan `rejection_reason` pada respon JSON `login()` |
| **Web Admin** | `jogjahub-web/src/app/admin/vendors/page.tsx` | Implementasikan Modal Dialog penolakan dengan presets & validasi |
| **Mobile** | `jogjahub-mobile/src/types/vendor.ts` | Tambahkan `rejection_reason` pada interface `TenantProfile` |
| **Mobile** | `jogjahub-mobile/src/features/auth/store/authSlice.ts` | Tambahkan `rejectionReason` ke state Redux & action helper |
| **Mobile** | `jogjahub-mobile/src/features/auth/store/bootstrapAuth.ts` | Persistensi & restorasi `rejectionReason` dari storage |
| **Mobile** | `jogjahub-mobile/src/features/auth/hooks/useLogin.ts` | Simpan `rejection_reason` ke Redux saat login |
| **Mobile** | `jogjahub-mobile/src/navigation/RootNavigator.tsx` | Daftarkan screen revisi di dalam navigator `pending-stack` |
| **Mobile** | `jogjahub-mobile/src/features/vendor/onboarding/screens/PendingApprovalScreen.tsx` | Tampilkan catatan admin dan tombol "Perbaiki Data Pendaftaran" |
| **Mobile** | `jogjahub-mobile/src/features/vendor/onboarding/screens/VendorOnboardingScreen.tsx` | Tampilkan banner catatan revisi & kirim data update ke backend |

---

> [!TIP]
> **Catatan untuk Pelaksana (Junior Developer / AI Agent):**
> Struktur backend sudah memiliki migrasi `rejection_reason` dan method `ProfileController@update` yang otomatis mereset status ke `pending`. Jangan membuat tabel baru atau mengubah nama kolom database. Cukup sambungkan aliran data antara Web $\rightarrow$ Backend $\rightarrow$ Mobile sesuai panduan di atas.

