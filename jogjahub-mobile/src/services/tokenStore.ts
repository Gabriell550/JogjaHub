// Penyimpanan token: in-memory (dipakai client.ts secara sinkron) +
// persisten di AsyncStorage (biar sesi tetap ada saat app di-kill / di-restart).
// Dipisah dari authSlice supaya client.ts bisa baca token tanpa import store
// (menghindari circular import antara api/ <-> store/).
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_STORAGE_KEY = '@jogjahub/token';

let currentToken: string | null = null;

export function setToken(token: string | null) {
  currentToken = token;

  // Efek samping persistensi — fire-and-forget (tidak di-await pemanggil),
  // tapi tetap .catch biar error tidak silent-crash.
  if (token) {
    AsyncStorage.setItem(TOKEN_STORAGE_KEY, token).catch((err) => {
      console.error('Gagal menyimpan token ke AsyncStorage:', err);
    });
  } else {
    AsyncStorage.removeItem(TOKEN_STORAGE_KEY).catch((err) => {
      console.error('Gagal menghapus token dari AsyncStorage:', err);
    });
  }
}

export function getToken(): string | null {
  return currentToken;
}

// Baca token yang tersimpan di disk (dipakai saat bootstrap app di RootNavigator).
export async function loadPersistedToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (err) {
    console.error('Gagal membaca token dari AsyncStorage:', err);
    return null;
  }
}
