// FR-04: admin approve/reject tenant. Path backend asli pakai "tenants", bukan "vendors".
// Route di-bind via getRouteKeyName() = 'uuid', jadi Wajib mengirim uuid (bukan id numerik).
import { apiClient } from './client';

export const adminApi = {
  listPendingVendors: () => apiClient.get('/admin/tenants/pending'),
  approveVendor: (tenantUuid: string) => apiClient.patch(`/admin/tenants/${tenantUuid}/approve`),
  rejectVendor: (tenantUuid: string, rejection_reason?: string) =>
    apiClient.patch(`/admin/tenants/${tenantUuid}/reject`, { rejection_reason }),

  // ⚠️ BELUM BISA DIPAKAI: Admin/DashboardController & Admin/BookingController di backend
  // masih kosong (tidak ada method sama sekali) — panggil ini sekarang akan error dari server,
  // bukan cuma "data kosong". Tetap pakai data mock di AdminDashboardScreen sampai diisi.
  getDashboardSummary: () => apiClient.get('/admin/dashboard/summary'),
  getTransactionMonitoring: () => apiClient.get('/admin/bookings'),
};
