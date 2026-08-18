import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../../../constants/theme';

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

type Props = {
  amount: number;
  periodLabel: string; // contoh: "Bulan ini • Nov 2024"
  dailyTrend?: number[]; // 0..1 per hari, dipakai tinggi bar mini di bawah — opsional
};

// TODO: `amount` & `dailyTrend` idealnya dari bookingApi/vendorApi (rekap transaksi selesai
// bulan berjalan). Untuk sekarang dipanggil dengan data mock dari VendorDashboardScreen.
export function RevenueCard({ amount, periodLabel, dailyTrend }: Props) {
  const formatted = `Rp ${amount.toLocaleString('id-ID')}`;
  const today = new Date().getDay(); // 0 = Minggu di JS, geser supaya Senin = index 0
  const todayIndex = today === 0 ? 6 : today - 1;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Laporan Pendapatan</Text>
        <View style={styles.trendBadge}>
          <Text style={styles.trendIcon}>📈</Text>
        </View>
      </View>
      <Text style={styles.period}>{periodLabel}</Text>
      <Text style={styles.amount}>{formatted}</Text>

      <View style={styles.daysRow}>
        {DAYS.map((day, i) => (
          <View key={day} style={styles.dayCol}>
            <View
              style={[
                styles.dayBar,
                {
                  height: 4 + (dailyTrend?.[i] ?? 0.3) * 20,
                  backgroundColor: i === todayIndex ? colors.primaryContainer : colors.surfaceContainerHigh,
                },
              ]}
            />
            <Text style={[styles.dayLabel, i === todayIndex && styles.dayLabelActive]}>{day}</Text>
          </View>
        ))}
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: typography.labelMd.fontFamily, fontSize: 13, fontWeight: '600', color: colors.onSurfaceVariant },
  trendBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendIcon: { fontSize: 13 },
  period: { fontFamily: typography.labelMd.fontFamily, fontSize: 12, color: colors.outline, marginTop: 4 },
  amount: {
    fontFamily: typography.headlineXl.fontFamily,
    fontSize: 26,
    fontWeight: '700',
    color: colors.onSurface,
    marginTop: 6,
    marginBottom: spacing.stackMd,
  },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayBar: { width: 14, borderRadius: 4 },
  dayLabel: { fontFamily: typography.labelMd.fontFamily, fontSize: 10, color: colors.outline },
  dayLabelActive: { color: colors.primary, fontWeight: '700' },
});
