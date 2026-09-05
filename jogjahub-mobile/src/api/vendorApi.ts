// Nama file & export tetap "vendorApi" (konsisten dengan penamaan role di app kita),
// TAPI semua path di dalamnya WAJIB pakai "tenant" — itu istilah asli di backend Laravel.
// Endpoint publik (dilihat customer): GET /tenants/map
// Endpoint role tenant (perlu login + approved): PUT /tenant/profile, GET/POST/PUT/DELETE /tenant/services
import { apiClient } from './client';

export const vendorApi = {
  listTenantsOnMap: () => apiClient.get('/tenants/map'),

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

  createService: (payload: FormData | Record<string, unknown>) => {
    if (payload instanceof FormData) {
      return apiClient.post('/tenant/services', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return apiClient.post('/tenant/services', payload);
  },

  // ⚠️ Laravel tidak baca file dari method PUT multipart secara native — kalau ada file baru,
  // kirim via POST dengan field `_method: 'PUT'` (method spoofing), pola standar Laravel.
  updateService: (serviceId: string | number, payload: FormData | Record<string, unknown>) => {
    if (payload instanceof FormData) {
      payload.append('_method', 'PUT');
      return apiClient.post(`/tenant/services/${serviceId}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return apiClient.put(`/tenant/services/${serviceId}`, payload);
  },

  deleteService: (serviceId: string | number) => apiClient.delete(`/tenant/services/${serviceId}`),
};