import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../../types/user';
import type { TenantProfile } from '../../../types/vendor';

interface AuthState {
  user: User | null;
  token: string | null;
  tenantStatus?: string | null;
  businessName?: string | null;
  tenantProfile?: TenantProfile | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  tenantStatus: null,
  businessName: null,
  tenantProfile: null,
};

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
    },
  },
});

export const { setSession, setTenantProfile, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
