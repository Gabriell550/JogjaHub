// Booking API untuk customer dan tenant. Tenant endpoints memerlukan autentikasi,
// role tenant, dan tenant yang sudah disetujui di backend.
import { apiClient } from './client';
import type { BookingRecord } from '../types/bookingRecord';

type CreateBookingPayload = {
  service_id: string | number;
  slot_id?: number;
  check_in_date?: string;
  check_out_date?: string;
};

export const bookingApi = {
  getAvailableSlots: (serviceId: string | number) => apiClient.get(`/services/${serviceId}/slots`),

  createBooking: (payload: CreateBookingPayload) => apiClient.post('/customer/bookings', payload),
  listMyBookings: (params?: { page?: number }) => apiClient.get('/customer/bookings', { params }),
  getMyBooking: (id: string) => apiClient.get<{ data: BookingRecord }>(`/customer/bookings/${id}`),
  confirmCompletion: (id: string) => apiClient.post<{ data: BookingRecord }>(`/customer/bookings/${id}/confirm-completion`),
  reportCompletionIssue: (id: string, reason: string) =>
    apiClient.post<{ data: BookingRecord }>(`/customer/bookings/${id}/completion-issue`, { reason }),
  markFulfilled: (id: string) => apiClient.post<{ data: BookingRecord }>(`/tenant/bookings/${id}/mark-fulfilled`),
  cancelBooking: (bookingId: string | number) => apiClient.post(`/customer/bookings/${bookingId}/cancel`),
  submitReview: (bookingId: string | number, payload: { rating: number; comment?: string }) =>
    apiClient.post(`/customer/bookings/${bookingId}/review`, payload),

  listAllBookings: async (role: 'customer' | 'tenant') => {
    const records: BookingRecord[] = [];
    let page = 1;
    let lastPage = 1;
    do {
      const { data } = await apiClient.get<{ data: BookingRecord[]; meta: { last_page: number } }>(
        '/' + role + '/bookings', { params: { page } }
      );
      records.push(...data.data);
      lastPage = data.meta.last_page;
      page += 1;
    } while (page <= lastPage);
    return records;
  },

  listIncomingBookings: (params?: { page?: number }) => apiClient.get('/tenant/bookings', { params }),
  getIncomingBooking: (id: string) => apiClient.get<{ data: BookingRecord }>('/tenant/bookings/' + id),
  updateBookingStatus: (bookingId: string | number, status: 'confirmed' | 'cancelled') =>
    apiClient.patch(`/tenant/bookings/${bookingId}/status`, { status }),
};
