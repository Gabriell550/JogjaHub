import { apiPost } from "@/src/lib/api";
import type {
  LoginApiResponse,
  LoginPayload,
  RegisterCustomerApiResponse,
  RegisterCustomerPayload,
  RegisterTenantApiResponse,
  RegisterTenantPayload,
} from "@/src/features/auth/types";

export const authApi = {
  login: (payload: LoginPayload) => apiPost<LoginApiResponse>("/auth/login", payload),
  registerCustomer: (payload: RegisterCustomerPayload) =>
    apiPost<RegisterCustomerApiResponse>("/auth/register/customer", payload),
  registerTenant: (payload: RegisterTenantPayload) =>
    apiPost<RegisterTenantApiResponse>("/auth/register/tenant", payload),
};