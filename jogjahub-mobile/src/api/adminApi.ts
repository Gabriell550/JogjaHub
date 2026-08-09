// FR-04: admin approve/reject vendor + monitoring transaksi & aktivitas
import { apiClient } from './client';

export const adminApi = {
  listPendingVendors: () => apiClient.get('/admin/vendors', { params: { status: 'pending' } }),
  approveVendor: (vendorId: string) => apiClient.patch(`/admin/vendors/${vendorId}/approve`),
  rejectVendor: (vendorId: string, reason: string) =>
    apiClient.patch(`/admin/vendors/${vendorId}/reject`, { reason }),
  getTransactionMonitoring: (params?: Record<string, unknown>) =>
    apiClient.get('/admin/transactions', { params }),
};
