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
  registerTenant: (payload: RegisterTenantPayload) => {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("email", payload.email);
    formData.append("password", payload.password);
    formData.append("password_confirmation", payload.password_confirmation);
    formData.append("phone", payload.phone ?? "");
    formData.append("address", payload.address ?? "");
    formData.append("latitude", String(payload.latitude));
    formData.append("longitude", String(payload.longitude));
    payload.categories.forEach((category) => formData.append("categories[]", category));
    if (payload.ktp) formData.append("ktp", payload.ktp);
    if (payload.nib) formData.append("nib", payload.nib);
    if (payload.portfolio) formData.append("portfolio", payload.portfolio);
    return apiPost<RegisterTenantApiResponse>("/auth/register/tenant", formData);
  },
};