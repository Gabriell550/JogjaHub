// Gabungkan slice dari tiap fitur di sini, mis. authSlice dari features/auth/store.
import { combineReducers } from '@reduxjs/toolkit';
// import { authReducer } from '../features/auth/store/authSlice';

export const rootReducer = combineReducers({
  // auth: authReducer,
});
