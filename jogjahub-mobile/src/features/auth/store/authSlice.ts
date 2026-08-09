import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../../types/user';

interface AuthState {
  user: User | null;
  token: string | null;
}

const initialState: AuthState = { user: null, token: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    logout(state) {
      state.user = null;
      state.token = null;
    },
  },
});

export const { setSession, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
