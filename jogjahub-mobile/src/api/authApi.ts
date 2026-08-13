// ASUMSI endpoint & bentuk response — sesuaikan 3 hal ini begitu backend beneran siap:
// 1. Path endpoint (POST /auth/login, dst) — cocokkan dengan dokumentasi/route Laravel asli
// 2. Bentuk response sukses — di useLogin.ts & useRegister.ts ada TODO yang nunjuk persis
//    baris mana yang baca response.data, itu yang perlu disesuaikan
// 3. Bentuk error response — dipakai di useLogin.ts & useRegister.ts saat baca err.response.data.message
import { apiClient } from './client';

export const authApi = {
  login: (payload: { email: string; password: string }) => apiClient.post('/auth/login', payload),

  registerCustomer: (payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone: string;
  }) => apiClient.post('/auth/register/customer', payload),

  registerTenant: (payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
  }) => apiClient.post('/auth/register/tenant', payload),

  // Vendor di backend saat ini dipetakan ke role tenant. Jadi endpoint yang benar adalah /auth/register/tenant.
  registerVendor: (formData: FormData) =>
    apiClient.post('/auth/register/tenant', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
