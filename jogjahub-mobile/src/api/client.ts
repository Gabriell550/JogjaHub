// Instance axios pusat: base URL /api/v1 + interceptor token Sanctum.
// Semua file *Api.ts WAJIB import dari sini, jangan bikin instance axios baru.
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

export const apiClient = axios.create({
  baseURL: API_BASE_URL, // contoh: https://api.jogjahub.com/api/v1
  timeout: 15000,
});

// TODO: pasang interceptor request untuk nempelin Authorization: Bearer <token>
// TODO: pasang interceptor response untuk handle 401 (auto logout) & format error konsisten
