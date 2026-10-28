// Tenant slot endpoints. Listing and deletion are scoped to the logged-in tenant;
// creation accepts one date per request.
import { apiClient } from './client';

export const timeSlotApi = {
  // Returns all dates (including past slots), sorted by date then start time.
  listByService: (serviceId: string | number) => apiClient.get(`/tenant/services/${serviceId}/time-slots`),

  createSlot: (payload: {
    service_id: string | number;
    slot_date: string; // format: YYYY-MM-DD
    start_time: string; // format: HH:mm
    end_time: string; // format: HH:mm
    quota: number;
  }) => apiClient.post('/tenant/time-slots', payload),

  // Backend nolak hapus (422) kalau slot itu sudah ada booking-nya (booked_count > 0) —
  // tangani pesan errornya di UI, bukan cuma anggap "gagal generik".
  deleteSlot: (slotId: string | number) => apiClient.delete(`/tenant/time-slots/${slotId}`),
};
