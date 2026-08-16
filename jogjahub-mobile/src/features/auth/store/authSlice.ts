import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../../types/user';

interface AuthState {
  user: User | null;
  token: string | null;
  tenantStatus?: string | null;
  businessName?: string | null;
}

const initialState: AuthState = { user: null, token: null, tenantStatus: null, businessName: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ 
      user: User
      token: string
      tenantStatus?: string
      businessName?: string
    }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.tenantStatus = action.payload.tenantStatus ?? null;
      state.businessName = action.payload.businessName ?? null;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.tenantStatus = null;
      state.businessName = null;
    },
  },
});

export const { setSession, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
