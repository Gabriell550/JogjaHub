// FR-04: admin approve/reject tenant. Path backend asli pakai "tenants", bukan "vendors".
import { apiClient } from './client';

export const adminApi = {
  listPendingVendors: () => apiClient.get('/admin/tenants/pending'),
  approveVendor: (tenantId: string | number) => apiClient.patch(`/admin/tenants/${tenantId}/approve`),
  rejectVendor: (tenantId: string | number) => apiClient.patch(`/admin/tenants/${tenantId}/reject`),

  // ⚠️ BELUM BISA DIPAKAI: Admin/DashboardController & Admin/BookingController di backend
  // masih kosong (tidak ada method sama sekali) — panggil ini sekarang akan error dari server,
  // bukan cuma "data kosong". Tetap pakai data mock di AdminDashboardScreen sampai diisi.
  getDashboardSummary: () => apiClient.get('/admin/dashboard/summary'),
  getTransactionMonitoring: () => apiClient.get('/admin/bookings'),
};
