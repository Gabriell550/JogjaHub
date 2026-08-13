import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { authApi } from '../../../api/authApi';
import { setSession } from '../store/authSlice';
import { setToken } from '../../../services/tokenStore';
import type { AppDispatch } from '../../../store';

type LoginPayload = { email: string; password: string };

export function useLogin() {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async ({ email, password }: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login({ email, password });

      // TODO ketika backend siap: cocokkan baris ini dengan bentuk response ASLI.
      // Sekarang diasumsikan: { data: { user: {...}, token: '...' } } (pola umum Laravel API Resource).
      // Kalau ternyata backend balikin langsung { user, token } tanpa pembungkus "data",
      // ganti baris di bawah jadi: const { user, token } = response.data;
      const { user, token } = response.data.data;

      dispatch(setSession({ user, token }));
      setToken(token); // supaya request berikutnya otomatis bawa header Authorization

      return { success: true as const };
    } catch (err: any) {
      // TODO ketika backend siap: cocokkan path "err.response.data.message" ini dengan
      // bentuk error response ASLI (mis. Laravel validation error biasanya di err.response.data.errors).
      const message = err?.response?.data?.message ?? 'Login gagal. Periksa email dan password.';
      setError(message);
      return { success: false as const, message };
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}
