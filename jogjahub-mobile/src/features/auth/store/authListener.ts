// Redux listener middleware untuk persistensi sesi ke AsyncStorage.
// Dipisah dari authSlice supaya reducer tetap pure (tanpa side-effect async
// di body reducer) — semua tulis/hapus disk terjadi di sini.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import type { RootState } from '../../../store';
import { logout, setSession, setTenantProfile } from './authSlice';

// Satu key gabungan JSON untuk seluruh data sesi non-token
// (user, tenantStatus, businessName, tenantProfile).
// Token disimpan terpisah di tokenStore.ts (TOKEN_STORAGE_KEY).
export const SESSION_STORAGE_KEY = '@jogjahub/session';

export const authListenerMiddleware = createListenerMiddleware();

// Tulis ulang sesi tiap kali data user/tenant berubah (login, update profil).
authListenerMiddleware.startListening({
  matcher: isAnyOf(setSession, setTenantProfile),
  effect: async (_action, listenerApi) => {
    try {
      const auth = (listenerApi.getState() as RootState).auth;
      await AsyncStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          user: auth.user,
          tenantStatus: auth.tenantStatus,
          businessName: auth.businessName,
          tenantProfile: auth.tenantProfile,
        }),
      );
    } catch (err) {
      console.error('Gagal menyimpan sesi ke AsyncStorage:', err);
    }
  },
});

// Hapus sesi saat logout — jangan sampai data user lama nyangkut di disk.
authListenerMiddleware.startListening({
  actionCreator: logout,
  effect: async () => {
    try {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (err) {
      console.error('Gagal menghapus sesi dari AsyncStorage:', err);
    }
  },
});