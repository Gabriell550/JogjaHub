// FR-08/FR-09 (customer bikin booking), FR-10 (vendor accept/reject), FR-11 (cancel)
import { apiClient } from './client';

export const bookingApi = {
  getAvailableSlots: (serviceId: string, date: string) =>
    apiClient.get(`/services/${serviceId}/slots`, { params: { date } }),
  createBooking: (payload: unknown) => apiClient.post('/customer/bookings', payload),
  listMyBookings: () => apiClient.get('/customer/bookings'),
  cancelBooking: (bookingId: string) =>
    apiClient.patch(`/customer/bookings/${bookingId}/cancel`),
  listIncomingBookings: () => apiClient.get('/vendor/bookings'),
  updateBookingStatus: (bookingId: string, status: 'confirmed' | 'cancelled') =>
    apiClient.patch(`/vendor/bookings/${bookingId}/status`, { status }),
};