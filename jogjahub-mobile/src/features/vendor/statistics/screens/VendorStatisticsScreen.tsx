import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';
import { SimpleBarChart } from '../../../../components/charts/SimpleBarChart';
import { StatCard } from '../components/StatCard';
import { getBookingStats, type PeriodKey } from '../bookingStats';
import { useTenantBookings } from '../../dashboard/useTenantBookings';


const PERIOD_TABS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'week', label: 'Minggu' },
  { key: 'month', label: 'Bulan' },
  { key: 'year', label: 'Tahun' },
];

const formatRupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

export default function VendorStatisticsScreen() {
  const navigation = useNavigation();
  const active = useIsFocused();
  const [period, setPeriod] = useState<PeriodKey>('week');

  const { records, error, reload } = useTenantBookings();
  const data = useMemo(() => getBookingStats(records ?? [], period), [records, period]);
  const totalRevenue = useMemo(() => data.revenue.reduce((a, b) => a + b, 0), [data]);
  const totalOrders = useMemo(() => data.orders.reduce((a, b) => a + b, 0), [data]);
  const avgOrderValue = data.paidCount > 0 ? Math.round(totalRevenue / data.paidCount) : 0;
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

      {error && <Text onPress={reload}>Statistik gagal dimuat. Coba lagi.</Text>}
      {!records && !error && <Text>Memuat statistik...</Text>}
      {records && <>
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

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Pesanan</Text>
            <Text style={styles.summaryValue}>{totalOrders}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Rata-rata per pembayaran</Text>
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
      </>}
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
