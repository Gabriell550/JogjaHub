// Konfigurasi store global (Redux Toolkit). Ganti dengan setup Zustand kalau itu yang dipilih.
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer';

export const store = configureStore({ reducer: rootReducer });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
