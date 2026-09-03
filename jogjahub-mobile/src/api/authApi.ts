import { apiClient } from './client';

type RegisterTenantPayload = {
  name: string;
  business_name?: string;
  address?: string;
  phone?: string;
  email: string;
  password: string;
  password_confirmation: string;
  categories?: string[];
};

export const authApi = {
  login: (payload: { email: string; password: string; role: 'customer' | 'tenant' }) => apiClient.post('/auth/login', payload),

  registerCustomer: (payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone: string;
  }) => apiClient.post('/auth/register/customer', payload),

  registerTenant: (payload: RegisterTenantPayload | FormData) => {
    if (payload instanceof FormData) {
      return apiClient.post('/auth/register/tenant', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    return apiClient.post('/auth/register/tenant', payload);
  },

  registerVendor: (payload: RegisterTenantPayload | FormData) => {
    if (payload instanceof FormData) {
      return apiClient.post('/auth/register/tenant', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    return apiClient.post('/auth/register/tenant', payload);
  },

  // Endpoint ini sudah ada & jalan di backend (POST /v1/auth/logout, hapus token Sanctum aktif)
  // tapi sebelumnya tidak pernah dipanggil — useLogout.ts cuma hapus state lokal.
  logout: () => apiClient.post('/auth/logout'),
};
