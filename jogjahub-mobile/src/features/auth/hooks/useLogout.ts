import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../store';
import { logout } from '../store/authSlice';
import { setToken } from '../../../services/tokenStore';

export function useLogout() {
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = () => {
    console.log('=== MULAI LOGOUT ===');

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