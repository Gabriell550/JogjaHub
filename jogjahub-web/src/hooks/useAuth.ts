"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi } from "@/src/features/auth/services/authApi";
import { clearSession, getSession, setSession } from "@/src/lib/auth";
import type {
  AuthSession,
  LoginPayload,
  RegisterCustomerPayload,
  RegisterTenantPayload,
} from "@/src/features/auth/types";

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  login: (payload: LoginPayload) => Promise<AuthSession>;
  registerCustomer: (payload: RegisterCustomerPayload) => Promise<AuthSession>;
  registerTenant: (payload: RegisterTenantPayload) => Promise<{ message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSessionState(getSession());
      setIsHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(payload);
      const newSession: AuthSession = {
        user: response.data.user,
        token: response.data.token,
        tenantStatus: response.data.tenant_status,
        businessName: response.data.business_name,
      };
      setSession(newSession);
      setSessionState(newSession);
      return newSession;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerCustomer = useCallback(async (payload: RegisterCustomerPayload) => {
    setIsLoading(true);
    try {
      const response = await authApi.registerCustomer(payload);
      const newSession: AuthSession = { user: response.data.user, token: response.data.token };
      setSession(newSession);
      setSessionState(newSession);
      return newSession;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerTenant = useCallback(async (payload: RegisterTenantPayload) => {
    setIsLoading(true);
    try {
      const response = await authApi.registerTenant(payload);
      return { message: response.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSessionState(null);
  }, []);

  return createElement(
    AuthContext.Provider,
    { value: { session, isAuthenticated: session !== null, isLoading, isHydrated, login, registerCustomer, registerTenant, logout } },
    children,
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return context;
}
