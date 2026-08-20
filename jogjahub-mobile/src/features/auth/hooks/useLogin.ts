import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { authApi } from '../../../api/authApi';
import { setSession } from '../store/authSlice';
import { setToken } from '../../../services/tokenStore';
import type { AppDispatch } from '../../../store';
import { logout } from '../store/authSlice';

type LoginPayload = { email: string; password: string; role: 'customer' | 'tenant' };

const getErrorMessage = (err: any, fallback: string) => {
  const errors = err?.response?.data?.errors;
  if (errors && typeof errors === 'object') {
    const firstError = Object.values(errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .find((value) => typeof value === 'string');

    if (firstError) return firstError;
  }

  return err?.response?.data?.message ?? fallback;
};

export function useLogin() {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async ({ email, password, role }: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      console.log('=== LOGIN REQUEST ===');
      console.log('email:', email);
      console.log('password length:', password.length);
      console.log('role:', role);

      const response = await authApi.login({ email, password, role });
      console.log('=== LOGIN RESPONSE ===');
      console.log(JSON.stringify(response.data, null, 2));

      const { user, token, tenant_status, business_name } = response.data.data;
      const normalizedUser = {
        ...user,
        role: user?.role === 'tenant' ? 'vendor' : user?.role,
      };

      console.log('=== EXTRACTED DATA ===');
      console.log('user.role:', user?.role);
      console.log('normalizedUser.role:', normalizedUser.role);
      console.log('tenant_status:', tenant_status);
      console.log('business_name:', business_name);
      console.log('USER DARI BACKEND:', user);
      console.log('ROLE:', user?.role);
      console.log('NORMALIZED:', normalizedUser);

      dispatch(setSession({ 
        user: normalizedUser,
        token,
        tenantStatus: tenant_status ?? null,
        businessName: business_name ?? null,
      }));
      setToken(token);

      console.log('=== DISPATCH COMPLETE ===');
      return { success: true as const };
    } catch (err: any) {
      console.log('=== LOGIN ERROR ===');
      console.log('error object:', err);
      console.log('status:', err?.response?.status);
      console.log('response data:', JSON.stringify(err?.response?.data, null, 2));
      console.log('request URL:', err?.config?.url);

      const message = getErrorMessage(err, 'Login gagal. Periksa email dan password.');
      setError(message);
      return { success: false as const, message };
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}
