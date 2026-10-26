import { apiGet, apiGetBlob, apiPatch } from "@/src/lib/api";
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

export type TenantDocumentType = "ktp" | "nib" | "portfolio";

export const adminApi = {
  getSummary: () => apiGet<{ success: boolean; data: DashboardSummary }>("/admin/dashboard/summary"),
  getPendingTenants: async () => {
    const response = await apiGet<AdminListResponse<PendingTenant>>("/admin/tenants/pending");
    if (!response.success) throw new Error("Backend gagal memuat pengajuan verifikasi.");
    return response;
  },
  getTenantDocument: (uuid: string, type: TenantDocumentType) =>
    apiGetBlob(`/admin/tenants/${encodeURIComponent(uuid)}/documents/${type}`),
  // Route backend di-bind via getRouteKeyName() = 'uuid', jadi wajib mengirim uuid
  // (bukan id numerik) agar tidak kena 404.
  approveTenant: async (uuid: string) => {
    const response = await apiPatch<{ success: boolean; message: string }>(
      `/admin/tenants/${encodeURIComponent(uuid)}/approve`,
    );
    if (!response.success) throw new Error(response.message || "Gagal menyetujui tenant.");
    return response;
  },
  rejectTenant: async (uuid: string, rejection_reason: string) => {
    const response = await apiPatch<{ success: boolean; message: string }>(
      `/admin/tenants/${encodeURIComponent(uuid)}/reject`,
      { rejection_reason },
    );
    if (!response.success) throw new Error(response.message || "Gagal menolak tenant.");
    return response;
  },
  getBookings: (params?: { status?: string }) =>
    apiGet<AdminListResponse<AdminBooking>>(
      `/admin/bookings${params?.status ? `?status=${encodeURIComponent(params.status)}` : ""}`,
    ),
  unwrapList,
};