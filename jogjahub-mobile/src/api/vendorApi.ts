// Nama file & export tetap "vendorApi" (konsisten dengan penamaan role di app kita),
// TAPI semua path di dalamnya WAJIB pakai "tenant" — itu istilah asli di backend Laravel.
// Endpoint publik (dilihat customer): GET /tenants/map
// Endpoint role tenant (perlu login + approved): PUT /tenant/profile, GET/POST/PUT/DELETE /tenant/services
import { apiClient } from './client';

export const vendorApi = {
  // Data tenant approved buat ditampilin di peta customer (CatalogScreen/VendorDetailScreen).
  // Backend TIDAK punya endpoint "detail satu tenant" terpisah — data lengkap didapat dari sini.
  listTenantsOnMap: () => apiClient.get('/tenants/map'),

  // PUT ini dipakai untuk BUAT sekaligus UPDATE profil (backend pakai updateOrCreate).
  // Beda dari authApi.registerVendor — ini "lengkapi profil" tahap 2 (VendorOnboardingScreen),
  // butuh address object lengkap + lat/long + category_ids (angka asli, bukan alias string).
  updateMyProfile: (payload: {
    business_name: string;
    description?: string;
    address: { street: string; city: string; province: string; postal_code?: string };
    latitude: number;
    longitude: number;
    whatsapp_number: string;
    category_ids: number[];
  }) => apiClient.put('/tenant/profile', payload),

  listMyServices: () => apiClient.get('/tenant/services'),

  // photos dikirim sebagai FormData kalau ada file — lihat services/fileUploadService.ts
  createService: (payload: FormData | Record<string, unknown>) => {
    if (payload instanceof FormData) {
      return apiClient.post('/tenant/services', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return apiClient.post('/tenant/services', payload);
  },

  updateService: (serviceId: string | number, payload: Record<string, unknown>) =>
    apiClient.put(`/tenant/services/${serviceId}`, payload),

  deleteService: (serviceId: string | number) => apiClient.delete(`/tenant/services/${serviceId}`),
};
