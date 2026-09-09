import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  TrendingUp,
  Package,
  ChevronRight,
} from 'lucide-react-native';

import {
  colors,
  typography,
  spacing,
  radius,
} from '../../../../constants/theme';

type HourPoint = {
  hour: string;
  value: number;
};

type Props = {
  label: string;
  amount?: number;
  growthPercent?: number;
  completedCount?: number;
  chartData?: HourPoint[];
  peakHour?: string;
  avgPerOrder?: number;
  onSeeAnalysis?: () => void;
};

/**
 * Format angka menjadi Rupiah.
 *
 * Contoh:
 * 100000 -> Rp100.000
 *
 * Menggunakan ?? 0 supaya tidak error
 * apabila data dari API masih undefined/null.
 */
const formatRupiah = (n?: number | null) => {
  return `Rp${(n ?? 0).toLocaleString('id-ID')}`;
};

export function PerformaCard({
  label = 'Performa',
  amount = 0,
  growthPercent = 0,
  completedCount = 0,
  chartData = [],
  peakHour = '-',
  avgPerOrder = 0,
  onSeeAnalysis,
}: Props) {
  /**
   * Pastikan chartData selalu berupa array.
   * Kalau API belum mengirim data, gunakan [].
   */
  const safeChartData = Array.isArray(chartData)
    ? chartData
    : [];

  /**
   * Cari nilai tertinggi untuk menentukan
   * tinggi masing-masing bar chart.
   */
  const maxValue = Math.max(
    ...safeChartData.map((d) => Number(d?.value) || 0),
    0.01,
  );

  /**
   * Debug sementara.
   *
   * Setelah semuanya normal, bagian ini boleh dihapus.
   */
  console.log('=== PERFORMA CARD ===');
  console.log('label:', label);
  console.log('amount:', amount);
  console.log('growthPercent:', growthPercent);
  console.log('completedCount:', completedCount);
  console.log('chartData:', safeChartData);
  console.log('peakHour:', peakHour);
  console.log('avgPerOrder:', avgPerOrder);

  return (
    <View style={styles.card}>

      {/* =========================
          HEADER
      ========================== */}
      <View style={styles.topRow}>

        <View style={styles.leftHeader}>
          <Text style={styles.label}>
            {label}
          </Text>

          {growthPercent !== 0 && (
            <View style={styles.growthBadge}>
              <TrendingUp
                size={10}
                color={colors.accentGreen}
              />

              <Text style={styles.growthText}>
                +{growthPercent}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.completedRow}>
          <Package
            size={12}
            color={colors.onSurfaceVariant}
          />

          <Text style={styles.completedText}>
            {completedCount} Selesai
          </Text>
        </View>

      </View>

      {/* =========================
          TOTAL AMOUNT
      ========================== */}
      <Text style={styles.amount}>
        {formatRupiah(amount)}
      </Text>

      {/* =========================
          CHART HEADER
      ========================== */}
      <View style={styles.chartHeaderRow}>

        <Text style={styles.chartTitle}>
          Aktivitas Penjualan (08:00 - 20:00)
        </Text>

        <View style={styles.peakBadge}>
          <Text style={styles.peakText}>
            Puncak {peakHour}
          </Text>
        </View>

      </View>

      {/* =========================
          BAR CHART
      ========================== */}
      <View style={styles.chartRow}>

        {safeChartData.length > 0 ? (
          safeChartData.map((point, index) => {

            const value = Number(point?.value) || 0;

            const isPeak =
              point?.hour === peakHour;

            const barHeight =
              8 + (value / maxValue) * 46;

            return (
              <View
                key={`${point?.hour ?? 'hour'}-${index}`}
                style={styles.barCol}
              >

                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: isPeak
                        ? colors.primaryContainer
                        : colors.surfaceContainerHigh,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.barLabel,
                    isPeak && styles.barLabelActive,
                  ]}
                >
                  {point?.hour ?? '-'}
                </Text>

              </View>
            );
          })
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>
              Belum ada data penjualan
            </Text>
          </View>
        )}

      </View>

      {/* =========================
          FOOTER
      ========================== */}
      <View style={styles.footerRow}>

        <Text style={styles.avgText}>
          Rata-rata {formatRupiah(avgPerOrder)}/pesanan
        </Text>

        <Pressable
          style={styles.analysisRow}
          onPress={onSeeAnalysis}
        >
          <Text style={styles.analysisText}>
            Lihat Analisis
          </Text>

          <ChevronRight
            size={14}
            color={colors.primary}
          />
        </Pressable>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  /* =========================
     CARD
  ========================== */

  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing.stackLg,
    elevation: 1,
  },

  /* =========================
     HEADER
  ========================== */

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  label: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },

  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.accentGreenContainer,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  growthText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.accentGreen,
  },

  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  completedText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },

  /* =========================
     AMOUNT
  ========================== */

  amount: {
    fontFamily: typography.headlineXl.fontFamily,
    fontSize: 26,
    fontWeight: '700',
    color: colors.onSurface,
    marginTop: 4,
    marginBottom: spacing.stackLg,
  },

  /* =========================
     CHART HEADER
  ========================== */

  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.stackMd,
  },

  chartTitle: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    flexShrink: 1,
  },

  peakBadge: {
    backgroundColor: colors.primaryFixed,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  peakText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.onPrimaryFixedVariant,
  },

  /* =========================
     CHART
  ========================== */

  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 70,
    marginBottom: spacing.stackMd,
  },

  barCol: {
    alignItems: 'center',
    gap: 6,
  },

  bar: {
    width: 16,
    minHeight: 8,
    borderRadius: 5,
  },

  barLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 9,
    color: colors.outline,
  },

  barLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  /* =========================
     EMPTY CHART
  ========================== */

  emptyChart: {
    flex: 1,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyChartText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },

  /* =========================
     FOOTER
  ========================== */

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.stackSm,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },

  avgText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },

  analysisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  analysisText: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

});