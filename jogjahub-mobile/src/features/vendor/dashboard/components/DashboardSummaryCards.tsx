import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, CheckCircle2, Star, Clock } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

type Props = {
  totalOrders: number;
  totalOrdersGrowthPercent: number;
  confirmedOrders: number;
  estimatedRevenue: number;
  completedRevenue: number;
  processingRevenue: number;
  storeRating: number;
  ratingCount: number;
  avgResponseMinutes: number;
};

const formatRupiahShort = (n: number) => {
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}M`.replace('.0M', 'M');
  if (n >= 1_000) return `Rp${(n / 1_000).toFixed(0)}rb`;
  return `Rp${n}`;
};
const formatRupiahFull = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

// TODO: semua angka di sini idealnya dari endpoint ringkasan dashboard tenant (belum ada di
// backend — Tenant/BookingController masih kosong). Sementara dipanggil dengan data mock dari
// VendorDashboardScreen, tapi struktur props-nya sudah disiapkan sesuai bentuk data yang wajar.
export function DashboardSummaryCards(props: Props) {
  const {
    totalOrders, totalOrdersGrowthPercent, confirmedOrders,
    estimatedRevenue, completedRevenue, processingRevenue,
    storeRating, ratingCount, avgResponseMinutes,
  } = props;

  return (
    <View>
      <View style={styles.topRow}>
        <View style={styles.smallCard}>
          <View style={styles.smallCardHeader}>
            <Text style={styles.smallLabel}>TOTAL PESANAN</Text>
            {totalOrdersGrowthPercent !== 0 && (
              <View style={styles.growthBadge}>
                <TrendingUp size={10} color={colors.accentGreen} />
                <Text style={styles.growthText}>+{totalOrdersGrowthPercent}%</Text>
              </View>
            )}
          </View>
          <Text style={styles.smallValue}>{totalOrders}</Text>
        </View>

        <View style={styles.smallCard}>
          <View style={styles.smallCardHeader}>
            <CheckCircle2 size={14} color={colors.tertiary} />
            <Text style={styles.smallLabel}>KONFIRMASI</Text>
          </View>
          <Text style={[styles.smallValue, { color: colors.tertiary }]}>{String(confirmedOrders).padStart(2, '0')}</Text>
        </View>
      </View>

      <View style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>ESTIMASI PENDAPATAN</Text>
        <Text style={styles.revenueValue}>{formatRupiahFull(estimatedRevenue)}</Text>
        <View style={styles.revenueBreakdownRow}>
          <View>
            <Text style={styles.breakdownLabel}>Selesai</Text>
            <Text style={styles.breakdownValue}>{formatRupiahShort(completedRevenue)}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View>
            <Text style={styles.breakdownLabel}>Proses</Text>
            <Text style={styles.breakdownValue}>{formatRupiahShort(processingRevenue)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Rating Toko</Text>
          <View style={styles.metricValueRow}>
            <Star size={14} color="#F5A623" fill="#F5A623" />
            <Text style={styles.metricValue}>{storeRating.toFixed(1)}</Text>
            <Text style={styles.metricSubtext}>({ratingCount.toLocaleString('id-ID')} ulasan)</Text>
          </View>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Waktu Respon</Text>
          <View style={styles.metricValueRow}>
            <Clock size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.metricValue}>~{avgResponseMinutes} Menit</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', gap: spacing.stackSm, marginBottom: spacing.stackSm },
  smallCard: { flex: 1, backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.lg, padding: spacing.stackMd, elevation: 1 },
  smallCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'space-between', marginBottom: 6 },
  smallLabel: { fontFamily: typography.labelMd.fontFamily, fontSize: 10, fontWeight: '700', color: colors.onSurfaceVariant },
  smallValue: { fontFamily: typography.headlineLgMobile.fontFamily, fontSize: 24, fontWeight: '700', color: colors.onSurface },
  growthBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.accentGreenContainer, borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  growthText: { fontFamily: typography.labelMd.fontFamily, fontSize: 10, fontWeight: '700', color: colors.accentGreen },

  revenueCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.lg, padding: spacing.stackLg, elevation: 1, marginBottom: spacing.stackSm },
  revenueLabel: { fontFamily: typography.labelMd.fontFamily, fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant, letterSpacing: 0.5 },
  revenueValue: { fontFamily: typography.headlineXl.fontFamily, fontSize: 26, fontWeight: '700', color: colors.onSurface, marginTop: 4, marginBottom: spacing.stackMd },
  revenueBreakdownRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.stackLg },
  breakdownLabel: { fontFamily: typography.labelMd.fontFamily, fontSize: 11, color: colors.onSurfaceVariant },
  breakdownValue: { fontFamily: typography.bodyMd.fontFamily, fontSize: 14, fontWeight: '700', color: colors.onSurface, marginTop: 2 },
  breakdownDivider: { width: 1, height: 28, backgroundColor: colors.outlineVariant },

  metricsRow: { flexDirection: 'row', backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.lg, padding: spacing.stackMd, elevation: 1 },
  metricItem: { flex: 1 },
  metricDivider: { width: 1, backgroundColor: colors.outlineVariant, marginHorizontal: spacing.stackMd },
  metricLabel: { fontFamily: typography.labelMd.fontFamily, fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 4 },
  metricValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricValue: { fontFamily: typography.titleMd.fontFamily, fontSize: 14, fontWeight: '700', color: colors.onSurface },
  metricSubtext: { fontFamily: typography.labelMd.fontFamily, fontSize: 10, color: colors.outline },
});
