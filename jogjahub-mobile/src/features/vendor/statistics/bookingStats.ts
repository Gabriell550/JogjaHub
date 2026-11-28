import type { BookingRecord } from '../../../types/bookingRecord';

export type PeriodKey = 'today' | 'week' | 'month' | 'year';

const hour = 3_600_000;
const day = 24 * hour;
const wibOffset = 7 * hour;
const dateLabel = new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', dateStyle: 'full' });
const rangeDateLabel = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric',
});
const monthLabel = new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', month: 'long', year: 'numeric' });

export function getBookingStats(bookings: BookingRecord[], period: PeriodKey, now = Date.now()) {
  // Use UTC date arithmetic after shifting timestamps into WIB.
  const local = new Date(now + wibOffset);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth();
  const date = local.getUTCDate();
  const today = Date.UTC(year, month, date);
  const monday = today - (local.getUTCDay() + 6) % 7 * day;
  const weekYear = new Date(monday + 3 * day).getUTCFullYear();
  const weekNumber = Math.floor((monday + 3 * day - Date.UTC(weekYear, 0, 1)) / (7 * day)) + 1;
  const periodLabels: Record<PeriodKey, string> = {
    today: dateLabel.format(today),
    week: `Minggu ke-${weekNumber} · ${rangeDateLabel.format(monday)} – ${rangeDateLabel.format(monday + 6 * day)}`,
    month: monthLabel.format(today),
    year: `Tahun ${year}`,
  };
  const monthStart = Date.UTC(year, month, 1);
  const ranges = {
    today: { labels: ['00–06', '06–12', '12–18', '18–24'], starts: [0, 6, 12, 18, 24].map(h => today + h * hour), previous: today - day },
    week: { labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'], starts: Array.from({ length: 8 }, (_, i) => monday + i * day), previous: monday - 7 * day },
    month: { labels: ['1–7', '8–14', '15–21', '22–akhir'], starts: [monthStart, monthStart + 7 * day, monthStart + 14 * day, monthStart + 21 * day, Date.UTC(year, month + 1, 1)], previous: Date.UTC(year, month - 1, 1) },
    year: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'], starts: Array.from({ length: 13 }, (_, i) => Date.UTC(year, i, 1)), previous: Date.UTC(year - 1, 0, 1) },
  };
  const { labels, starts, previous } = ranges[period];
  const revenue = labels.map(() => 0);
  const orders = labels.map(() => 0);
  const paidCounts = labels.map(() => 0);
  let previousRevenue = 0;
  let previousOrders = 0;
  let previousPaidCount = 0;
  let paidCount = 0;
  const bucketFor = (time: number) => labels.findIndex((_, i) => time >= starts[i] && time < starts[i + 1]);

  for (const booking of bookings) {
    const createdAt = Date.parse(booking.created_at ?? '') + wibOffset;
    const orderBucket = bucketFor(createdAt);
    if (orderBucket >= 0) orders[orderBucket]++;
    else if (createdAt >= previous && createdAt < starts[0]) previousOrders++;
    if (booking.payment?.status !== 'paid') continue;
    const paidAt = Date.parse(booking.payment.paid_at ?? '') + wibOffset;
    const amount = Number(booking.total_amount ?? 0);
    const paymentBucket = bucketFor(paidAt);
    if (paymentBucket >= 0) {
      revenue[paymentBucket] += amount;
      paidCount++;
      paidCounts[paymentBucket]++;
    } else if (paidAt >= previous && paidAt < starts[0]) {
      previousRevenue += amount;
      previousPaidCount++;
    }
  }
  return { periodLabel: periodLabels[period], labels, revenue, orders, previousRevenue, previousOrders, previousPaidCount, paidCount, paidCounts };
}
