import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { authApi } from '../../../api/authApi';
import { setSession } from '../store/authSlice';
import { User } from '../../../types/user';

export function useLogin() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(payload: { email: string; password: string }) {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authApi.login(payload);
      const user: User = data.user ?? data;
      const token: string = data.token;
      dispatch(setSession({ user, token }));
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message ?? 'Login gagal. Periksa email & password Anda.');
    } finally {
      setLoading(false);
    }
  }

  return { login, loading, error };
}
