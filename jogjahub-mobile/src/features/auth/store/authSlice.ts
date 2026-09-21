import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../../types/user';
import type { TenantProfile } from '../../../types/vendor';

interface AuthState {
  user: User | null;
  token: string | null;
  tenantStatus?: string | null;
  businessName?: string | null;
  tenantProfile?: TenantProfile | null;
  // true setelah bootstrapAuth() selesai (ada/tidak ada sesi) —
  // RootNavigator menjaga loading splash selama masih false supaya tidak flash ke Login.
  isHydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  tenantStatus: null,
  businessName: null,
  tenantProfile: null,
  isHydrated: false,
};

// Payload untuk restore sesi dari AsyncStorage saat app dibuka.
// null berarti tidak ada sesi valid yang tersimpan.
export type RestoreSessionPayload = {
  user: User;
  token: string;
  tenantStatus?: string;
  businessName?: string;
  tenantProfile?: TenantProfile;
} | null;

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{
      user: User
      token: string
      tenantStatus?: string
      businessName?: string
      tenantProfile?: TenantProfile
    }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.tenantStatus = action.payload.tenantStatus ?? null;
      state.businessName = action.payload.businessName ?? null;
      state.tenantProfile = action.payload.tenantProfile ?? null;
      state.isHydrated = true;
    },
    setTenantProfile(state, action: PayloadAction<TenantProfile | null>) {
      state.tenantProfile = action.payload;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.tenantStatus = null;
      state.businessName = null;
      state.tenantProfile = null;
      // Tetap true supaya UI tidak balik ke loading screen setelah logout.
      state.isHydrated = true;
    },
    restoreSession(state, action: PayloadAction<RestoreSessionPayload>) {
      const payload = action.payload;
      if (payload) {
        state.user = payload.user;
        state.token = payload.token;
        state.tenantStatus = payload.tenantStatus ?? null;
        state.businessName = payload.businessName ?? null;
        state.tenantProfile = payload.tenantProfile ?? null;
      } else {
        state.user = null;
        state.token = null;
        state.tenantStatus = null;
        state.businessName = null;
        state.tenantProfile = null;
      }
      // Bootstrap selesai dalam kondisi apa pun — loading splash boleh ditutup.
      state.isHydrated = true;
    },
  },
});

export const { setSession, setTenantProfile, logout, restoreSession } = authSlice.actions;
export const authReducer = authSlice.reducer;
