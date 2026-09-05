import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { SegmentedTabs } from '../../../../components/SegmentedTabs/SegmentedTabs';
import { SimpleBarChart } from '../../../../components/charts/SimpleBarChart';

type PeriodKey = 'today' | 'week' | 'month' | 'year';

const PERIOD_TABS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'week', label: 'Minggu' },
  { key: 'month', label: 'Bulan' },
  { key: 'year', label: 'Tahun' },
];

function getMockRevenueData(period: PeriodKey) {
  const presets: Record<PeriodKey, { labels: string[]; revenue: number[]; orders: number[] }> = {
    today: {
      labels: ['00-06', '06-12', '12-18', '18-24'],
      revenue: [0, 850000, 1650000, 900000],
      orders: [0, 3, 5, 2],
    },
    week: {
      labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      revenue: [420000, 610000, 380000, 900000, 1250000, 2100000, 1740000],
      orders: [2, 3, 1, 4, 5, 8, 6],
    },
    month: {
      labels: ['Mgu 1', 'Mgu 2', 'Mgu 3', 'Mgu 4'],
      revenue: [4200000, 5650000, 3980000, 6450000],
      orders: [18, 24, 15, 28],
    },
    year: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
      revenue: [12000000, 9800000, 14200000, 11500000, 15800000, 13200000, 16400000, 12450000, 0, 0, 0, 0],
      orders: [45, 38, 52, 41, 58, 49, 61, 47, 0, 0, 0, 0],
    },
  };
  return presets[period];
}

const formatRupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;
const formatRupiahShort = (n: number) => {
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}M`.replace('.0M', 'M');
  if (n >= 1_000) return `Rp${(n / 1_000).toFixed(0)}rb`;
  return `Rp${n}`;
};

type Props = {
  currentRevenue?: number;
};

export function RevenueChartCard({ currentRevenue = 0 }: Props) {
  const [period, setPeriod] = useState<PeriodKey>('week');

  const data = useMemo(() => getMockRevenueData(period), [period]);
  const totalRevenue = useMemo(() => data.revenue.reduce((a, b) => a + b, 0), [data]);
  const totalOrders = useMemo(() => data.orders.reduce((a, b) => a + b, 0), [data]);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const now = new Date();
  const dateLabel = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const periodLabel = now.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Estimasi Pendapatan</Text>
      </View>
      <Text style={styles.dateLabel}>{dateLabel}</Text>
      <Text style={styles.periodLabel}>{periodLabel}</Text>
      <Text style={styles.amount}>{formatRupiah(currentRevenue || totalRevenue)}</Text>

      <SegmentedTabs tabs={PERIOD_TABS} activeKey={period} onChange={(key) => setPeriod(key as PeriodKey)} />

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Pendapatan</Text>
          <Text style={styles.summaryValue}>{formatRupiah(totalRevenue)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Order</Text>
          <Text style={styles.summaryValue}>{totalOrders}</Text>
        </View>
      </View>
      <Text style={styles.avgText}>Rata-rata per order: {formatRupiah(avgOrderValue)}</Text>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Grafik Pendapatan</Text>
        <SimpleBarChart
          labels={data.labels}
          values={data.revenue}
          color={colors.primaryContainer}
          valueFormatter={formatRupiahShort}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.stackLg,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  dateLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    color: colors.outline,
    marginTop: 4,
  },
  periodLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    color: colors.outline,
    marginBottom: 4,
  },
  amount: {
    fontFamily: typography.headlineXl.fontFamily,
    fontSize: 26,
    fontWeight: '700',
    color: colors.onSurface,
    marginTop: 6,
    marginBottom: spacing.stackMd,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.stackSm,
    marginTop: spacing.stackLg,
    marginBottom: spacing.stackSm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.lg,
    padding: spacing.stackMd,
  },
  summaryLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    color: colors.onSecondaryContainer,
  },
  summaryValue: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSecondaryContainer,
    marginTop: 2,
  },
  avgText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.stackLg,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.stackLg,
    marginTop: spacing.stackMd,
  },
  chartTitle: {
    fontFamily: typography.titleMd.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: spacing.stackMd,
  },
});