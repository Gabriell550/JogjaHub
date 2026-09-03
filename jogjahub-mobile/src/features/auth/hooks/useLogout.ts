import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../store';
import { logout } from '../store/authSlice';
import { setToken } from '../../../services/tokenStore';
import { authApi } from '../../../api/authApi';

export function useLogout() {
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = async () => {
    console.log('=== MULAI LOGOUT ===');

    // Beri tahu server dulu supaya token Sanctum yang aktif dihapus di sana juga —
    // kalau ini dilewati, token lama tetap valid dipakai walau app sudah "logout".
    // Dibungkus try/catch: gagal (offline/timeout) tetap lanjut clear state lokal,
    // supaya user tidak terjebak tidak bisa logout gara-gara jaringan.
    try {
      await authApi.logout();
    } catch (err) {
      console.log('Gagal logout ke server (lanjut logout lokal):', err);
    }

    // Hapus token
    setToken(null);

    // Hapus user/session dari Redux
    dispatch(logout());

    console.log('=== LOGOUT SELESAI ===');
  };

  return {
    handleLogout,
  };
}
