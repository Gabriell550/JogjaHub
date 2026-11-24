import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../../../constants/theme';
import type { BookingRecord } from '../../../../types/bookingRecord';
import { getBookingStats, type PeriodKey } from '../bookingStats';
import { StatCard } from './StatCard';

const periods: readonly { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'week', label: 'Minggu' },
  { key: 'month', label: 'Bulan' },
  { key: 'year', label: 'Tahun' },
];

const formatCount = (value: number) => Math.round(value).toLocaleString('id-ID');
const formatRupiah = (value: number) => 'Rp' + formatCount(value);
const average = (total: number, count: number) => count > 0 ? total / count : 0;
const change = (current: number, previous: number) => previous > 0 ? (current / previous - 1) * 100 : null;
const emptyRecords: BookingRecord[] = [];

export function TenantStatisticsCards({ records = emptyRecords, initialPeriod, active, ordersOnly = false }: {
  records?: BookingRecord[];
  initialPeriod: PeriodKey;
  active: boolean;
  ordersOnly?: boolean;
}) {
  const [period, setPeriod] = useState(initialPeriod);
  const data = useMemo(() => getBookingStats(records, period), [records, period]);
  const revenue = data.revenue.reduce((sum, value) => sum + value, 0);
  const orders = data.orders.reduce((sum, value) => sum + value, 0);
  const averagePayment = average(revenue, data.paidCount);
  const props = { periods, period, onChangePeriod: setPeriod, active };

  return (
    <View style={styles.cards}>
      {!ordersOnly && <StatCard {...props} label="Total Pendapatan" value={revenue} values={data.revenue}
        change={change(revenue, data.previousRevenue)} formatValue={formatRupiah} />}
      <StatCard {...props} label="Total Pesanan" value={orders} values={data.orders}
        change={change(orders, data.previousOrders)} formatValue={formatCount} />
      {!ordersOnly && <StatCard {...props} label="Rata-rata per Pembayaran" value={averagePayment}
        values={data.revenue.map((value, index) => average(value, data.paidCounts[index]))}
        change={change(averagePayment, average(data.previousRevenue, data.previousPaidCount))} formatValue={formatRupiah} />}
    </View>
  );
}

const styles = StyleSheet.create({ cards: { gap: spacing.stackMd } });
