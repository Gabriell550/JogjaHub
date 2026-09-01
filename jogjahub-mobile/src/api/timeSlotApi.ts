// Endpoint atur jadwal/slot milik tenant sendiri — dipakai untuk ManageCalendarScreen.
// Backend sudah punya logika penuh untuk ini (bukan endpoint kosong seperti booking).
import { apiClient } from './client';

export const timeSlotApi = {
  // Daftar slot untuk satu layanan tertentu (tanggal, jam, kuota, berapa yang sudah dibooking).
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
