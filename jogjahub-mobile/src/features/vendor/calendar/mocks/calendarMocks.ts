// ============ MOCK DATA (nanti diganti API) ============

export const DAYS_OF_WEEK_ID = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'] as const;
export type DayOfWeekId = (typeof DAYS_OF_WEEK_ID)[number];

export const MOCK_WORKING_HOURS: WorkingHour[] = [
  { id: 1, day_of_week: 1, label: 'Sesi Pagi', start_time: '08:00', end_time: '12:00' },
  { id: 2, day_of_week: 1, label: 'Sesi Siang', start_time: '13:00', end_time: '17:00' },
  { id: 3, day_of_week: 2, label: 'Sesi Pagi', start_time: '08:00', end_time: '12:00' },
  { id: 4, day_of_week: 2, label: 'Sesi Siang', start_time: '13:00', end_time: '17:00' },
  { id: 5, day_of_week: 3, label: 'Sesi Pagi', start_time: '08:00', end_time: '12:00' },
  { id: 6, day_of_week: 3, label: 'Sesi Siang', start_time: '13:00', end_time: '17:00' },
  { id: 7, day_of_week: 4, label: 'Sesi Pagi', start_time: '08:00', end_time: '12:00' },
  { id: 8, day_of_week: 4, label: 'Sesi Siang', start_time: '13:00', end_time: '17:00' },
  { id: 9, day_of_week: 5, label: 'Sesi Pagi', start_time: '08:00', end_time: '12:00' },
  { id: 10, day_of_week: 5, label: 'Sesi Siang', start_time: '13:00', end_time: '17:00' },
  { id: 11, day_of_week: 6, label: 'Sesi Pagi', start_time: '08:00', end_time: '12:00' },
  { id: 12, day_of_week: 6, label: 'Sesi Siang', start_time: '13:00', end_time: '17:00' },
];

export const MOCK_BLOCKED_DATES: BlockedDate[] = [
  { id: 1, start_date: '2026-09-28', end_date: '2026-10-01', reason: 'Libur Lebaran' },
  { id: 2, start_date: '2026-12-25', end_date: '2026-12-26', reason: 'Libur Natal' },
];

export const MOCK_BOOKING_LIMIT_H1 = 24; // jam

export const MOCK_STORE_STATUS: Record<string, boolean> = {
  // tanggal jam buka/tutup — mock: semua hari buka kecuali yang diblokir
  '2026-09-04': false, // misal hari libur nanti di-render libur
  '2026-09-11': false,
};
