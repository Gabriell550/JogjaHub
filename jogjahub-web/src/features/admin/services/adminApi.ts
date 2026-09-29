import { apiGet, apiPatch } from "@/src/lib/api";
import type {
  AdminBooking,
  AdminListResponse,
  DashboardSummary,
  PendingTenant,
} from "@/src/features/admin/types";

/**
 * Backend memakai JSON Resource Collection yang bisa dirender sebagai array
 * datar maupun bungkus paginator `{ data: [...] }`. Helper ini menormalkan
 * keduanya menjadi array biasa agar halaman admin tetap benar.
 */
export function unwrapList<T>(payload: T[] | { data: T[] }): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && Array.isArray(payload.data)) return payload.data;
  return [];
}

export const adminApi = {
  getSummary: () => apiGet<{ success: boolean; data: DashboardSummary }>("/admin/dashboard/summary"),
  getPendingTenants: () => apiGet<AdminListResponse<PendingTenant>>("/admin/tenants/pending"),
  approveTenant: (id: number) => apiPatch<{ success: boolean; message: string }>(`/admin/tenants/${id}/approve`),
  rejectTenant: (id: number, rejection_reason: string) =>
    apiPatch<{ success: boolean; message: string }>(`/admin/tenants/${id}/reject`, { rejection_reason }),
  getBookings: (params?: { status?: string }) =>
    apiGet<AdminListResponse<AdminBooking>>(
      `/admin/bookings${params?.status ? `?status=${encodeURIComponent(params.status)}` : ""}`,
    ),
  unwrapList,
};