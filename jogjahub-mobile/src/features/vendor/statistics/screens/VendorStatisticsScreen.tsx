import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
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

// TODO: ganti generator mock ini dengan panggilan endpoint asli begitu backend punya
// sesuatu seperti GET /tenant/dashboard/stats?period=today|week|month|year. Bentuk baliknya
// disiapkan mendekati apa yang wajar: { labels: string[], revenue: number[], orders: number[] }.
function getMockStatsData(period: PeriodKey) {
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
      revenue: [4_200_000, 5_650_000, 3_980_000, 6_450_000],
      orders: [18, 24, 15, 28],
    },
    year: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
      revenue: [12_000_000, 9_800_000, 14_200_000, 11_500_000, 15_800_000, 13_200_000, 16_400_000, 12_450_000, 0, 0, 0, 0],
      orders: [45, 38, 52, 41, 58, 49, 61, 47, 0, 0, 0, 0],
    },
  };
  return presets[period];
}

const formatRupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

export default function VendorStatisticsScreen() {
  const navigation = useNavigation();
  const [period, setPeriod] = useState<PeriodKey>('week');

  const data = useMemo(() => getMockStatsData(period), [period]);
  const totalRevenue = useMemo(() => data.revenue.reduce((a, b) => a + b, 0), [data]);
  const totalOrders = useMemo(() => data.orders.reduce((a, b) => a + b, 0), [data]);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Statistik</Text>
        <View style={{ width: 22 }} />
      </View>

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
        <SimpleBarChart labels={data.labels} values={data.revenue} color={colors.primaryContainer} valueFormatter={formatRupiah} />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Grafik Total Order</Text>
        <SimpleBarChart labels={data.labels} values={data.orders} color={colors.tertiaryContainer} valueFormatter={(n) => `${n} order`} />
      </View>

      <Text style={styles.disclaimer}>
        Data di halaman ini masih contoh (mock) — akan diganti data asli begitu backend punya endpoint ringkasan statistik tenant.
      </Text>
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
  summaryRow: { flexDirection: 'row', gap: spacing.stackSm, marginTop: spacing.stackLg },
  summaryCard: { flex: 1, backgroundColor: colors.secondaryContainer, borderRadius: radius.lg, padding: spacing.stackMd },
  summaryLabel: { fontFamily: typography.labelMd.fontFamily, fontSize: 11, color: colors.onSecondaryContainer },
  summaryValue: { fontFamily: typography.titleMd.fontFamily, fontSize: 16, fontWeight: '700', color: colors.onSecondaryContainer, marginTop: 2 },
  avgText: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.onSurfaceVariant, marginTop: spacing.stackSm, marginBottom: spacing.stackLg },
  chartCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.lg, padding: spacing.stackLg, elevation: 1, marginBottom: spacing.stackMd },
  chartTitle: { fontFamily: typography.titleMd.fontFamily, fontSize: 14, fontWeight: '600', color: colors.onSurface, marginBottom: spacing.stackMd },
  disclaimer: { fontFamily: typography.labelMd.fontFamily, fontSize: 11, color: colors.outline, textAlign: 'center', marginTop: spacing.stackSm, fontStyle: 'italic' },
});
