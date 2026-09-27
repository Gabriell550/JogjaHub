export type UserRole = "customer" | "tenant" | "admin";
export type TenantStatus = "pending" | "approved" | "rejected";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
  role: "customer" | "tenant" | "admin";
}

export interface RegisterCustomerPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}

export interface RegisterTenantPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  address?: string;
  phone?: string;
  categories?: string[];
}

export interface AuthSession {
  user: AuthUser;
  token: string | null;
  tenantStatus?: TenantStatus;
  businessName?: string;
}

export interface LoginApiResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    token: string;
    tenant_status?: TenantStatus;
    business_name?: string;
  };
}

export interface RegisterCustomerApiResponse {
  success: boolean;
  message: string;
  data: { user: AuthUser; token: string };
}

export interface RegisterTenantApiResponse {
  success: boolean;
  message: string;
  data: { user: AuthUser; tenant_profile: Record<string, unknown> };
}
