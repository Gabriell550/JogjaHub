import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { SimpleBarChart } from '../../../../components/charts/SimpleBarChart';
import { StatCard } from '../components/StatCard';

type PeriodKey = 'today' | 'week' | 'month' | 'year';

const PERIOD_TABS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'week', label: 'Minggu' },
  { key: 'month', label: 'Bulan' },
  { key: 'year', label: 'Tahun' },
];

// TODO: ganti generator mock ini dengan panggilan endpoint asli begitu backend punya
// sesuatu seperti GET /tenant/dashboard/stats?period=today|week|month|year. Bentuk baliknya
// disiapkan dengan data pembanding untuk periode sebelumnya.
function getMockStatsData(period: PeriodKey) {
  const presets: Record<PeriodKey, { labels: string[]; revenue: number[]; orders: number[]; previousRevenue: number }> = {
    today: {
      labels: ['00-06', '06-12', '12-18', '18-24'],
      revenue: [0, 850000, 1650000, 900000],
      orders: [0, 3, 5, 2],
      previousRevenue: 3_650_000,
    },
    week: {
      labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      revenue: [420000, 610000, 380000, 900000, 1250000, 2100000, 1740000],
      orders: [2, 3, 1, 4, 5, 8, 6],
      previousRevenue: 6_800_000,
    },
    month: {
      labels: ['Mgu 1', 'Mgu 2', 'Mgu 3', 'Mgu 4'],
      revenue: [4_200_000, 5_650_000, 3_980_000, 6_450_000],
      orders: [18, 24, 15, 28],
      previousRevenue: 18_000_000,
    },
    year: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
      revenue: [12_000_000, 9_800_000, 14_200_000, 11_500_000, 15_800_000, 13_200_000, 16_400_000, 12_450_000, 0, 0, 0, 0],
      orders: [45, 38, 52, 41, 58, 49, 61, 47, 0, 0, 0, 0],
      previousRevenue: 80_000_000,
    },
  };
  return presets[period];
}

const formatRupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

export default function VendorStatisticsScreen() {
  const navigation = useNavigation();
  const active = useIsFocused();
  const [period, setPeriod] = useState<PeriodKey>('week');

  const data = useMemo(() => getMockStatsData(period), [period]);
  const totalRevenue = useMemo(() => data.revenue.reduce((a, b) => a + b, 0), [data]);
  const totalOrders = useMemo(() => data.orders.reduce((a, b) => a + b, 0), [data]);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const revenueChange = data.previousRevenue > 0 ? (totalRevenue / data.previousRevenue - 1) * 100 : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Kembali" onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={22} color={colors.onSurface} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>Statistik</Text>
        <View style={{ width: 22 }} />
      </View>

      <StatCard
        periods={PERIOD_TABS}
        period={period}
        onChangePeriod={setPeriod}
        revenue={totalRevenue}
        change={revenueChange}
        values={data.revenue}
        formatRevenue={formatRupiah}
        active={active}
      />
      <Text style={styles.disclaimer}>Data contoh</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Pesanan</Text>
          <Text style={styles.summaryValue}>{totalOrders}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Rata-rata per pesanan</Text>
          <Text style={styles.summaryValue}>{formatRupiah(avgOrderValue)}</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Grafik Pendapatan</Text>
        <SimpleBarChart labels={data.labels} values={data.revenue} color={colors.primaryContainer} valueFormatter={formatRupiah} />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Grafik Pesanan</Text>
        <SimpleBarChart labels={data.labels} values={data.orders} color={colors.tertiaryContainer} valueFormatter={(n) => `${n} pesanan`} />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.containerMargin, paddingTop: 60, paddingBottom: spacing.sectionGap },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.stackLg },
  title: {
    fontFamily: typography.headlineLgMobile.fontFamily,
    fontSize: typography.headlineLgMobile.fontSize,
    fontWeight: typography.headlineLgMobile.fontWeight,
    color: colors.onSurface,
  },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.stackSm, marginVertical: spacing.stackMd },
  summaryCard: { flexGrow: 1, minWidth: 128, backgroundColor: colors.secondaryContainer, borderRadius: radius.lg, padding: spacing.stackMd },
  summaryLabel: { ...typography.bodySm, color: colors.onSurfaceVariant },
  summaryValue: { ...typography.headlineSm, color: colors.onSurface, marginTop: 4 },
  chartCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.lg, padding: spacing.stackLg, elevation: 1, marginBottom: spacing.stackMd },
  chartTitle: { fontFamily: typography.titleMd.fontFamily, fontSize: 14, fontWeight: '600', color: colors.onSurface, marginBottom: spacing.stackMd },
  disclaimer: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: spacing.stackSm },
});
