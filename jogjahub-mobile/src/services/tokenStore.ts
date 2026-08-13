// Penyimpanan token sementara (in-memory saja, hilang kalau app di-restart).
// Dipisah dari authSlice supaya client.ts bisa baca token tanpa import store
// (menghindari circular import antara api/ <-> store/).
// TODO ketika backend sudah siap: ganti jadi persisten pakai AsyncStorage,
// dan panggil setToken(...) hasil baca AsyncStorage itu di RootNavigator saat isReady di-cek.
let currentToken: string | null = null;

export function setToken(token: string | null) {
  currentToken = token;
}

export function getToken(): string | null {
  return currentToken;
}
