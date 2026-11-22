import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { ChevronRight, Package, TrendingUp } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../../constants/theme';
import { tenantColors } from '../../../../constants/theme/tenant';
import { RevenueAreaChart, revenueChartHeight } from '../../components/RevenueAreaChart';
import { TenantPressable } from '../../components/TenantPressable';
import { useStatCardMotion } from '../../components/useStatCardMotion';
import { dashboardStyles } from './tenantDashboardStyles';

type Props = {
  label: string;
  amount?: number;
  growthPercent?: number;
  completedCount?: number;
  chartData?: { hour: string; value: number }[];
  peakHour?: string;
  avgPerOrder?: number;
  onSeeAnalysis?: () => void;
};

const formatRupiah = (amount: number) => `Rp${amount.toLocaleString('id-ID')}`;
const emptyPoints: NonNullable<Props['chartData']> = [];

export function PerformaCard({
  label = 'Performa', amount = 0, growthPercent = 0, completedCount = 0,
  chartData = emptyPoints, peakHour = '-', avgPerOrder = 0, onSeeAnalysis,
}: Props) {
  const focused = useIsFocused();
  const points = Array.isArray(chartData) ? chartData : emptyPoints;
  const values = useMemo(() => points.map(point => Number(point?.value) || 0), [points]);
  const { points: chartPoints } = useStatCardMotion(values, focused);
  const growth = `${growthPercent > 0 ? '+' : ''}${growthPercent}%`;
  const completed = `${completedCount} Selesai`;
  const average = `Rata-rata ${formatRupiah(avgPerOrder ?? 0)}/pesanan`;
  const peak = `Puncak ${peakHour}`;
  const activity = points.length ? `Aktivitas Penjualan (08:00 - 20:00). ${peak}` : 'Belum ada data penjualan';
  const chartLabel = [growthPercent !== 0 && `Perubahan pendapatan ${growth}`, completed, activity, average]
    .filter(Boolean).join('. ');

  return (
    <View style={[dashboardStyles.card, styles.card]}>
      <View style={dashboardStyles.headingRow}>
        <Text accessibilityRole="header" style={dashboardStyles.heading}>{label}</Text>
        <Text style={dashboardStyles.sample}>Data contoh</Text>
      </View>
      <Text style={styles.amount}>{formatRupiah(amount ?? 0)}</Text>
      <View accessible accessibilityLabel={chartLabel}>
        <View aria-hidden style={styles.activity}>
          <View style={styles.metrics}>
            {growthPercent !== 0 && (
              <View style={[styles.chip, growthPercent > 0 ? styles.positive : styles.negative]}>
                <TrendingUp size={14} color={growthPercent > 0 ? tenantColors.onPositive : colors.error} />
                <Text style={[styles.metric, growthPercent > 0 ? styles.positiveText : styles.negativeText]}>
                  {growth}
                </Text>
              </View>
            )}
            <View style={styles.metricPair}>
              <Package size={14} color={colors.onSurfaceVariant} />
              <Text style={styles.metric}>{completed}</Text>
            </View>
          </View>
          <View style={[dashboardStyles.headingRow, styles.plotHeader]}>
            <Text style={styles.metric}>Aktivitas Penjualan (08:00 - 20:00)</Text>
            {points.length > 0 && (
              <View style={[styles.chip, styles.peak]}>
                <Text style={[styles.metric, styles.peakText]}>{peak}</Text>
              </View>
            )}
          </View>
          {points.length > 0 ? (
            <View style={styles.plot}>
              <RevenueAreaChart points={chartPoints} />
              <View style={styles.hours}>
                {points.map((point, index) => (
                  <Text key={`${point?.hour ?? 'hour'}-${index}`} style={[styles.hour, point?.hour === peakHour && styles.peakHour]}>
                    {point?.hour ?? '-'}
                  </Text>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.metric}>Belum ada data penjualan</Text>
            </View>
          )}
        </View>
      </View>
      <View style={[dashboardStyles.headingRow, styles.footer]}>
        <Text aria-hidden style={styles.metric}>{average}</Text>
        {onSeeAnalysis && (
          <TenantPressable style={dashboardStyles.link} accessibilityRole="button" onPress={onSeeAnalysis}>
            <Text style={dashboardStyles.linkText}>Lihat Analisis</Text>
            <View aria-hidden><ChevronRight size={16} color={colors.primary} /></View>
          </TenantPressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.stackMd, gap: 4 },
  amount: { ...typography.headlineLg, color: colors.onSurface },
  activity: { gap: 8 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 4, maxWidth: '100%',
  },
  positive: { backgroundColor: colors.accentGreenContainer },
  positiveText: { color: tenantColors.onPositive },
  negative: { backgroundColor: colors.errorContainer },
  negativeText: { color: colors.error },
  metricPair: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%' },
  metric: { ...typography.bodySm, color: colors.onSurfaceVariant, flexShrink: 1 },
  plotHeader: { rowGap: 4, marginTop: 4 },
  peak: { backgroundColor: colors.primaryFixed },
  peakText: { color: colors.onPrimaryFixedVariant },
  plot: { gap: 4 },
  hours: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  hour: { ...typography.labelSm, color: colors.onSurfaceVariant, flexShrink: 1, textAlign: 'center' },
  peakHour: { color: colors.primary },
  empty: { minHeight: revenueChartHeight, alignItems: 'center', justifyContent: 'center' },
  footer: { borderTopWidth: 1, borderTopColor: tenantColors.border, marginTop: 4, paddingTop: 8 },
});
