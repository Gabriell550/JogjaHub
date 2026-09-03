// FR-08/FR-09 (customer bikin booking), FR-10 (tenant accept/reject), FR-11 (cancel)
//
// ⚠️ PENTING: path di bawah ini SUDAH sesuai routes/api.php, TAPI Customer/BookingController
// dan Tenant/BookingController di backend MASIH KOSONG (tidak ada method sama sekali).
// Artinya memanggil fungsi manapun di sini (selain getAvailableSlots) akan mengembalikan
// error dari server, bukan cuma data kosong. Jangan disambungkan ke screen dulu —
// tetap pakai data mock di IncomingOrdersScreen/MyBookingsScreen sampai temanmu isi controllernya.
import { apiClient } from './client';

export const bookingApi = {
  // Satu-satunya fungsi di file ini yang SUDAH bisa dipakai sekarang (Customer/ServiceController::slots).
  getAvailableSlots: (serviceId: string | number) => apiClient.get(`/services/${serviceId}/slots`),

  // Belum bisa dipakai — Customer/BookingController kosong.
  createBooking: (payload: unknown) => apiClient.post('/customer/bookings', payload),
  listMyBookings: () => apiClient.get('/customer/bookings'),
  cancelBooking: (bookingId: string | number) => apiClient.post(`/customer/bookings/${bookingId}/cancel`),
  submitReview: (bookingId: string | number, payload: unknown) =>
    apiClient.post(`/customer/bookings/${bookingId}/review`, payload),

  // Belum bisa dipakai — Tenant/BookingController kosong.
  listIncomingBookings: () => apiClient.get('/tenant/bookings'),
  updateBookingStatus: (bookingId: string | number, status: 'confirmed' | 'cancelled') =>
    apiClient.patch(`/tenant/bookings/${bookingId}/status`, { status }),
};