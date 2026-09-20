// Thunk bootstrap saat app dibuka: tebak sesi dari disk (token + data user).
// Kalau lengkap → restore ke Redux; kalau tidak ada / korup → cleanup dan
// anggap belum login (isHydrated tetap diset true supaya tidak loading selamanya).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../store';
import { restoreSession } from './authSlice';
import { SESSION_STORAGE_KEY } from './authListener';
import {
  loadPersistedToken,
  setToken,
  TOKEN_STORAGE_KEY,
} from '../../../services/tokenStore';
import type { User } from '../../../types/user';
import type { TenantProfile } from '../../../types/vendor';

type PersistedSession = {
  user: User | null;
  tenantStatus?: string | null;
  businessName?: string | null;
  tenantProfile?: TenantProfile | null;
};

export function bootstrapAuth(): ThunkAction<
  Promise<void>,
  RootState,
  undefined,
  UnknownAction
> {
  return async (dispatch) => {
    try {
      const token = await loadPersistedToken();

      // Tanpa token tidak ada sesi yang bisa direstore — sekalian bersihkan
      // session key yang mungkin tersisa dari state rusak.
      if (!token) {
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
        dispatch(restoreSession(null));
        return;
      }

      const rawSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

      // Token ada tapi data user tidak → sesi tidak lengkap, anggap belum login.
      if (!rawSession) {
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        dispatch(restoreSession(null));
        return;
      }

      let session: PersistedSession;
      try {
        session = JSON.parse(rawSession) as PersistedSession;
      } catch (err) {
        // Data korup — hapus key yang rusak dan anggap tidak ada sesi.
        console.error('Sesi korup, dihapus:', err);
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
        dispatch(restoreSession(null));
        return;
      }

      if (!session?.user) {
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
        dispatch(restoreSession(null));
        return;
      }

      // Isi kembali token in-memory supaya client.ts langsung memakainya,
      // lalu pulihkan sesi ke Redux (isHydrated otomatis jadi true).
      setToken(token);
      dispatch(
        restoreSession({
          user: session.user,
          token,
          tenantStatus: session.tenantStatus ?? undefined,
          businessName: session.businessName ?? undefined,
          tenantProfile: session.tenantProfile ?? undefined,
        }),
      );
    } catch (err) {
      // Error tak terduga (mis. AsyncStorage gagal) — tetap anggap selesai
      // hydrate supaya app tidak macet di loading screen.
      console.error('Gagal bootstrap auth:', err);
      dispatch(restoreSession(null));
    }
  };
}