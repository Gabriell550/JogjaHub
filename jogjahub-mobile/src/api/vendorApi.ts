// Endpoint publik (dilihat customer): GET /vendors, GET /vendors/:id
// Endpoint role vendor: GET/PUT /vendor/profile, GET/POST/PUT /vendor/services
import { apiClient } from './client';

export const vendorApi = {
  listVendors: (params?: Record<string, unknown>) =>
    apiClient.get('/vendors', { params }),
  getVendorDetail: (vendorId: string) => apiClient.get(`/vendors/${vendorId}`),
  getMyProfile: () => apiClient.get('/vendor/profile'),
  updateMyProfile: (payload: unknown) => apiClient.put('/vendor/profile', payload),
  listMyServices: () => apiClient.get('/vendor/services'),
  createService: (payload: unknown) => apiClient.post('/vendor/services', payload),
};
