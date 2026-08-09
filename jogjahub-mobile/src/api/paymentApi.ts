// MVP: pembayaran manual (upload bukti transfer) atau COD/Pay on Arrival.
// Struktur endpoint disiapkan supaya gampang extend ke payment gateway (out-of-scope MVP).
import { apiClient } from './client';

export const paymentApi = {
  uploadPaymentProof: (bookingId: string, formData: FormData) =>
    apiClient.post(`/customer/bookings/${bookingId}/payment-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
