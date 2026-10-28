// Booking API untuk customer dan tenant. Tenant endpoints memerlukan autentikasi,
// role tenant, dan tenant yang sudah disetujui di backend.
import { apiClient } from './client';

export const bookingApi = {
  // Satu-satunya fungsi di file ini yang SUDAH bisa dipakai sekarang (Customer/ServiceController::slots).
  getAvailableSlots: (serviceId: string | number) => apiClient.get(`/services/${serviceId}/slots`),

  createBooking: (payload: unknown) => apiClient.post('/customer/bookings', payload),
  listMyBookings: () => apiClient.get('/customer/bookings'),
  cancelBooking: (bookingId: string | number) => apiClient.post(`/customer/bookings/${bookingId}/cancel`),
  submitReview: (bookingId: string | number, payload: unknown) =>
    apiClient.post(`/customer/bookings/${bookingId}/review`, payload),

  listIncomingBookings: (params?: { page?: number }) => apiClient.get('/tenant/bookings', { params }),
  updateBookingStatus: (bookingId: string | number, status: 'confirmed' | 'cancelled') =>
    apiClient.patch(`/tenant/bookings/${bookingId}/status`, { status }),
};