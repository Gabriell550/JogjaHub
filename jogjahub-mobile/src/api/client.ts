// Instance axios pusat: base URL /api/v1 + interceptor token Sanctum.
// Semua file *Api.ts WAJIB import dari sini, jangan bikin instance axios baru.
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { getToken } from '../services/tokenStore';

export const apiClient = axios.create({
  baseURL: API_BASE_URL, // contoh: https://api.jogjahub.com/api/v1
  timeout: 15000,
});

// Nempelin Authorization: Bearer <token> otomatis ke semua request yang butuh auth
// (endpoint publik seperti /categories tetap aman, header ini cuma nempel kalau token ada).
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// TODO ketika backend sudah siap & bentuk error response-nya diketahui:
// tambah interceptors.response untuk auto-logout saat 401, dan format error jadi konsisten
// (mis. selalu return { message: string } biar semua hook error-nya seragam).
