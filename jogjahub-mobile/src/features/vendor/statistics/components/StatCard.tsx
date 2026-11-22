import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../../constants/theme';
import { tenantColors } from '../../../../constants/theme/tenant';
import { RevenueAreaChart, revenueChartHeight } from '../../components/RevenueAreaChart';
import { TenantPressable } from '../../components/TenantPressable';
import { useStatCardMotion } from '../../components/useStatCardMotion';

type Props<Period extends string> = {
  periods: readonly { key: Period; label: string }[];
  period: Period;
  onChangePeriod: (period: Period) => void;
  revenue: number;
  change: number | null;
  values: readonly number[];
  formatRevenue: (value: number) => string;
  active: boolean;
};

const percent = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const formatChange = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${percent.format(rounded || 0)}%`;
};

export function StatCard<Period extends string>({
  periods, period, onChangePeriod, revenue, change, values, formatRevenue, active,
}: Props<Period>) {
  const [selectorWidth, setSelectorWidth] = useState(0);
  const selectedIndex = Math.max(0, periods.findIndex(item => item.key === period));
  const frame = useStatCardMotion(values, active, { revenue, change: change ?? 0, selectedIndex });
  const slotWidth = selectorWidth / Math.max(1, periods.length);
  const comparison = change === null ? '' : `. ${formatChange(change)} dibanding periode sebelumnya`;
  const range = periods[selectedIndex]?.label ?? 'periode ini';
  const falling = frame.change < -0.05;

  return (
    <View style={styles.card}>
      <View
        accessible
        accessibilityLabel={`Total Pendapatan ${range}, ${formatRevenue(revenue)}${comparison}`}
        style={styles.metrics}
      >
        <View style={styles.header}>
          <Text style={styles.label}>Total Pendapatan</Text>
          {change !== null && (
            <View style={styles.comparison}>
              <Text style={[styles.delta, falling && styles.deltaNegative]}>{formatChange(frame.change)}</Text>
              <Text style={styles.comparisonLabel}>vs periode sebelumnya</Text>
            </View>
          )}
        </View>
        <Text style={styles.revenue}>{formatRevenue(frame.revenue)}</Text>
      </View>

      {values.length > 0 ? <RevenueAreaChart points={frame.points} /> : (
        <View style={styles.emptyChart}>
          <Text style={styles.comparisonLabel}>Belum ada data pendapatan</Text>
        </View>
      )}

      <View style={styles.track}>
        <View style={styles.periods} onLayout={event => setSelectorWidth(event.nativeEvent.layout.width)}>
          {selectorWidth > 0 && periods.length > 0 && (
            <View aria-hidden pointerEvents="none" style={[styles.indicator, {
              width: slotWidth,
              transform: [{ translateX: frame.indicator * slotWidth }],
            }]} />
          )}
          {periods.map(item => (
            <TenantPressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: item.key === period }}
              onPress={() => onChangePeriod(item.key)}
              focusRadius={radius.full}
              style={styles.period}
            >
              <Text style={[styles.periodLabel, item.key === period && styles.periodSelected]}>
                {item.label}
              </Text>
            </TenantPressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.xl, borderWidth: 1,
    borderColor: tenantColors.border, padding: spacing.stackMd, gap: 12,
  },
  metrics: { gap: 4 },
  header: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  label: { ...typography.bodyMd, color: colors.onSurfaceVariant, flexShrink: 1 },
  revenue: { ...typography.headlineXl, color: colors.onSurface, fontVariant: ['tabular-nums'] },
  comparison: { alignItems: 'flex-end', maxWidth: '100%', gap: 4 },
  delta: {
    ...typography.labelMd, color: tenantColors.onPositive, backgroundColor: colors.accentGreenContainer,
    fontVariant: ['tabular-nums'], borderRadius: radius.full, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4,
  },
  deltaNegative: { color: colors.onErrorContainer, backgroundColor: colors.errorContainer },
  comparisonLabel: { ...typography.bodySm, color: colors.onSurfaceVariant },
  emptyChart: { minHeight: revenueChartHeight, justifyContent: 'center' },
  track: { padding: 3, backgroundColor: tenantColors.canvas, borderRadius: radius.full },
  periods: { flexDirection: 'row' },
  indicator: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: colors.primaryFixed, borderRadius: radius.full },
  period: { flex: 1, alignItems: 'center', padding: 6, borderRadius: radius.full },
  periodLabel: { ...typography.labelSm, color: colors.onSurfaceVariant, textAlign: 'center' },
  periodSelected: { color: colors.onPrimaryFixedVariant },
});
