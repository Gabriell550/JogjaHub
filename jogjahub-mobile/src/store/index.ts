// Konfigurasi store global (Redux Toolkit).
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer';
import { authListenerMiddleware } from '../features/auth/store/authListener';

export const store = configureStore({
  reducer: rootReducer,
  // Listener middleware wajib dipasang supaya persistensi sesi (tulis/hapus
  // AsyncStorage) berjalan otomatis saat setSession / setTenantProfile / logout.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(authListenerMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
